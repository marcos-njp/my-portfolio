// lib/data-profiler/csv-parse.ts
//
// CSV intake. This module owns file IO, the ambient clock (progress
// throttling) and the read watchdog, so it is deliberately impure — but it is
// kept a thin adapter: papaparse does the RFC 4180 tokenizing, and everything
// this module adds is bookkeeping (header validation, row cap, ragged-row
// issues, progress, abort, timeout). No randomness.
//
// Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.14, 1.15

import Papa from 'papaparse';

import { READ_TIMEOUT_MS, ROW_CAP, SIZE_CAP_BYTES } from '@/lib/data-profiler/constants';
import type { ParseIssue, ParsedDataset } from '@/lib/data-profiler/types';

export interface ParseHandlers {
  /** Whole number 0..100, throttled to at most one call per 250ms — Req 1.8. */
  onProgress(percent: number): void;
}

export type ParseRejection =
  | { kind: 'size'; sizeMb: string; capMb: number } // Req 1.4
  | { kind: 'extension' } // Req 1.5
  | { kind: 'empty' } // Req 1.9
  | { kind: 'header'; reason: 'no-fields' | 'empty-name' | 'duplicate-name' } // Req 1.15
  | { kind: 'read'; reason: 'io' | 'timeout' }; // Req 1.14

export type ParseOutcome =
  | { ok: true; dataset: ParsedDataset }
  | { ok: false; rejection: ParseRejection };

const BYTES_PER_MB = 1024 * 1024;

/** Papaparse slices the `File` into byte ranges of this size — design.md. */
const CHUNK_SIZE_BYTES = 1024 * 1024;

/**
 * Requirement 1.8 asks for an update at least every 500ms. 250ms sits
 * comfortably inside that floor without thrashing React with a re-render per
 * chunk on a fast local read.
 */
const PROGRESS_THROTTLE_MS = 250;

/**
 * Shared papaparse options for both entry points.
 *
 * - `header: false` — this module validates and stores the header row itself
 *   (Requirement 1.15 has to reject duplicate names, which papaparse's own
 *   header mode silently de-duplicates away).
 * - `dynamicTyping: false` — every retained value stays a string. The type
 *   layer decides what a value *means*; the parser must not pre-empt it, and
 *   coercion would break the Requirement 1.12 round trip.
 * - `skipEmptyLines: false` — papaparse's blank-line skipping also drops a
 *   quoted empty record (`""`), which is exactly how `csv-serialize.ts` emits
 *   an empty field in a single-column dataset. Trailing-blank handling is done
 *   here instead; see `commitPendingBlanks`.
 * - `delimiter: ','` — pinned rather than auto-detected. Auto-detection can
 *   pick a tab or semicolon on an unlucky first line and silently reshape the
 *   dataset.
 * - No `transform` and no trimming: field values survive verbatim.
 */
const BASE_OPTIONS = {
  header: false as const,
  dynamicTyping: false as const,
  skipEmptyLines: false as const,
  delimiter: ',',
};

/** `.csv` match is case-insensitive — `DATA.CSV` is the same file to a user. */
function hasCsvExtension(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.csv');
}

/**
 * A physically empty record. Papaparse renders both a blank line and a quoted
 * empty field as `['']`, so the two are indistinguishable at this layer.
 */
function isBlankRecord(row: readonly string[]): boolean {
  return row.length === 1 && row[0] === '';
}

/**
 * Validates the header row before any data row is read (Requirement 1.15).
 *
 * Names are compared exactly and case-sensitively — `Column` and `column` are
 * two distinct columns, matching how the rest of the pipeline keys on header
 * strings. A name that is empty or whitespace-only is rejected; names are
 * otherwise stored verbatim, never trimmed, so the round trip preserves them.
 */
function validateHeader(row: readonly string[]): ParseRejection | null {
  if (row.length === 0) return { kind: 'header', reason: 'no-fields' };

  const seen = new Set<string>();
  for (const name of row) {
    if (name === undefined || name === null || name.trim() === '') {
      return { kind: 'header', reason: 'empty-name' };
    }
    if (seen.has(name)) return { kind: 'header', reason: 'duplicate-name' };
    seen.add(name);
  }
  return null;
}

interface RowCollector {
  /** Feeds a batch of records. Returns a header rejection, or `null` to continue. */
  accept(records: string[][]): ParseRejection | null;
  /** Finalizes the dataset, or rejects when there is no header / no data row. */
  finish(): ParseOutcome;
}

/**
 * Accumulates records into a `ParsedDataset`.
 *
 * Memory is bounded by `ROW_CAP`, not by the file: rows past the cap advance
 * `totalRowCount` and are then dropped (Requirement 1.7). Ragged rows are
 * recorded and parsing continues (Requirement 1.10); `rowIndex` is the
 * **0-based data row index**, header excluded, consistent with `ParseIssue`
 * usage elsewhere in the pipeline — the UI is what adds 1 if it wants to show
 * a line number for Requirement 1.11.
 *
 * Blank records are buffered rather than committed on sight. At `finish()`
 * exactly one trailing blank record is discarded, because
 * `csv-serialize.ts` terminates every record with CRLF (as does almost every
 * CSV writer), which leaves one empty line at end of document. Any further
 * trailing blanks, and every interior blank, are kept as real rows — for a
 * multi-column header they then show up as ragged rows, which is the honest
 * report for a malformed line.
 */
function createRowCollector(sourceName: string): RowCollector {
  let headers: string[] | null = null;
  const rows: string[][] = [];
  const issues: ParseIssue[] = [];
  let totalRowCount = 0;
  let pendingBlankCount = 0;

  function commitRow(row: string[]): void {
    const rowIndex = totalRowCount;
    totalRowCount += 1;

    const expectedFieldCount = (headers as string[]).length;
    if (row.length !== expectedFieldCount) {
      issues.push({ rowIndex, expectedFieldCount, actualFieldCount: row.length });
    }

    if (rows.length < ROW_CAP) rows.push(row);
  }

  function commitPendingBlanks(keepBack: number): void {
    while (pendingBlankCount > keepBack) {
      pendingBlankCount -= 1;
      commitRow(['']);
    }
  }

  return {
    accept(records) {
      for (const row of records) {
        if (headers === null) {
          const rejection = validateHeader(row);
          if (rejection !== null) return rejection;
          headers = [...row];
          continue;
        }

        if (isBlankRecord(row)) {
          pendingBlankCount += 1;
          continue;
        }

        commitPendingBlanks(0);
        commitRow(row);
      }
      return null;
    },

    finish() {
      if (headers === null) return { ok: false, rejection: { kind: 'header', reason: 'no-fields' } };

      commitPendingBlanks(1);
      pendingBlankCount = 0;

      if (totalRowCount === 0) return { ok: false, rejection: { kind: 'empty' } };

      return {
        ok: true,
        dataset: {
          sourceName,
          headers,
          rows,
          retainedRowCount: rows.length,
          totalRowCount,
          issues,
          truncated: totalRowCount > rows.length,
        },
      };
    },
  };
}

/**
 * An aborted parse resolves as a read failure rather than hanging.
 *
 * Requirement 8.7 has the caller discard any in-flight result through its
 * monotonic `runId` guard, so this value is never displayed. Resolving is
 * still preferable to a promise that never settles: the caller's `await`
 * always completes, no closure is retained forever, and there is no extra
 * union member for the UI to map to a message it must never show.
 */
const ABORTED_OUTCOME: ParseOutcome = { ok: false, rejection: { kind: 'read', reason: 'io' } };

/**
 * Reads a `File` in the browser and produces a `ParsedDataset`
 * (Requirements 1.3, 1.6). Nothing is ever uploaded.
 *
 * Size and extension are checked first and reject without issuing any read
 * (Requirements 1.4, 1.5). Papaparse then streams the file in 1MB chunks with
 * `worker: false` — worker mode resolves its own script URL at runtime, which
 * is fragile under Turbopack, and chunked streaming already yields the main
 * thread between chunks. Progress is `Math.round(cursor / file.size * 100)`
 * throttled to 250ms, with a final 100 emitted on completion so the indicator
 * never sticks below complete (Requirement 1.8).
 *
 * A `READ_TIMEOUT_MS` watchdog is armed before the read starts and cleared on
 * every settled path, so a resolved parse can never fire it later; on fire the
 * parse is aborted and the outcome is `{ kind: 'read', reason: 'timeout' }`.
 * A papaparse `error` maps to `{ kind: 'read', reason: 'io' }`
 * (Requirement 1.14). `signal.aborted` is checked in the chunk callback and
 * stops the chunk loop.
 */
export function parseCsvFile(
  file: File,
  handlers: ParseHandlers,
  signal: AbortSignal,
): Promise<ParseOutcome> {
  if (file.size > SIZE_CAP_BYTES) {
    return Promise.resolve({
      ok: false,
      rejection: {
        kind: 'size',
        sizeMb: (file.size / BYTES_PER_MB).toFixed(2),
        capMb: SIZE_CAP_BYTES / BYTES_PER_MB,
      },
    });
  }

  if (!hasCsvExtension(file.name)) {
    return Promise.resolve({ ok: false, rejection: { kind: 'extension' } });
  }

  if (signal.aborted) return Promise.resolve(ABORTED_OUTCOME);

  return new Promise<ParseOutcome>((resolve) => {
    const collector = createRowCollector(file.name);

    let settled = false;
    let lastProgressAt = 0;
    let activeParser: Papa.Parser | null = null;

    // `settle` closes over `timer`, which is declared after it. That is safe:
    // the reference is evaluated when `settle` is *called*, and the earliest
    // possible call is from the watchdog callback or a papaparse callback, both
    // of which are registered after `timer` is initialised.
    const settle = (outcome: ParseOutcome): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(outcome);
    };

    const timer = setTimeout(() => {
      // Settle *before* aborting: `parser.abort()` invokes papaparse's
      // `complete` callback synchronously, and that callback would otherwise
      // win the race and settle this promise with a partial dataset.
      settle({ ok: false, rejection: { kind: 'read', reason: 'timeout' } });
      // `activeParser` is null only when the watchdog fires before the first
      // chunk arrives; the `settled` check in `chunk` aborts the loop then.
      activeParser?.abort();
    }, READ_TIMEOUT_MS);

    Papa.parse<string[], File>(file, {
      ...BASE_OPTIONS,
      worker: false,
      chunkSize: CHUNK_SIZE_BYTES,

      chunk(results, parser) {
        activeParser = parser;

        if (settled) {
          parser.abort();
          return;
        }

        // Both branches below settle before aborting. `parser.abort()` calls
        // papaparse's `complete` callback synchronously, so aborting first
        // would let `complete` settle this promise with `collector.finish()` —
        // reporting a partial dataset instead of the abort or the header
        // rejection that actually stopped the read.
        if (signal.aborted) {
          settle(ABORTED_OUTCOME);
          parser.abort();
          return;
        }

        const rejection = collector.accept(results.data);
        if (rejection !== null) {
          settle({ ok: false, rejection });
          parser.abort();
          return;
        }

        if (file.size > 0) {
          const now = Date.now();
          if (now - lastProgressAt >= PROGRESS_THROTTLE_MS) {
            lastProgressAt = now;
            const percent = Math.round((results.meta.cursor / file.size) * 100);
            handlers.onProgress(Math.min(100, Math.max(0, percent)));
          }
        }
      },

      complete() {
        if (settled) return;
        handlers.onProgress(100);
        settle(collector.finish());
      },

      error() {
        settle({ ok: false, rejection: { kind: 'read', reason: 'io' } });
      },
    });
  });
}

/**
 * Synchronous text path, used for bundled sample datasets and for the
 * Requirement 1.12 round trip.
 *
 * Applies the same header validation, row cap and ragged-row recording as
 * `parseCsvFile`, with no size check, no extension check and no progress —
 * the text is already in memory and there is nothing to read.
 *
 * Values are preserved exactly: empty fields, quoted fields containing commas
 * or doubled quotes, and embedded newlines all survive verbatim, and nothing
 * is trimmed or coerced.
 */
export function parseCsvText(text: string, sourceName: string): ParseOutcome {
  const collector = createRowCollector(sourceName);
  const results = Papa.parse<string[]>(text, BASE_OPTIONS);

  const rejection = collector.accept(results.data);
  if (rejection !== null) return { ok: false, rejection };

  return collector.finish();
}
