// lib/data-profiler/csv-serialize.ts
//
// CSV serialization for a `ParsedDataset`. Pure module: no side effects, no
// ambient clock, no randomness, no input mutation. Every export is total.
//
// This is one half of the Requirement 1.12 round trip — the other half is
// `parseCsvText()` in `csv-parse.ts`. Nothing in production depends on this
// module; it exists so the round-trip property has a serializer to invert.
//
// Requirements: 1.12

import type { ParsedDataset } from '@/lib/data-profiler/types';

/**
 * RFC 4180 names CRLF as the record separator, so that is what is emitted.
 *
 * The parser must accept both CRLF and a bare LF as a record separator
 * regardless: a field can legally *contain* a bare LF, and such a field is
 * quoted here, so the parser sees LF in two different roles within one
 * document and has to distinguish them by quoting context rather than by
 * byte.
 */
const RECORD_SEPARATOR = '\r\n';

/** Characters whose presence makes quoting mandatory under RFC 4180. */
const MUST_QUOTE = /[",\r\n]/;

/**
 * True when the field must or should be wrapped in double quotes.
 *
 * Beyond the four RFC 4180 characters, three cases are quoted defensively
 * because they are where the round trip is most likely to break:
 *
 * - **Empty string.** An unquoted empty field in a single-column dataset
 *   produces a physically empty line, which most parsers (papaparse with
 *   `skipEmptyLines` among them) drop as blank. Emitting `""` keeps the record
 *   present and one field wide.
 * - **Leading or trailing spaces/tabs.** Papaparse does not trim by default,
 *   but whitespace immediately adjacent to a delimiter is exactly where
 *   implementations diverge, and a trailing `\r` would otherwise fuse with the
 *   CRLF separator. Quoting removes the ambiguity entirely.
 * - **Whitespace-only.** A superset of the previous case, and the value that
 *   would silently become `''` if anything trimmed. Quoting makes the retained
 *   value survive verbatim, which is what 1.12 compares.
 *
 * A leading U+FEFF is also quoted: a byte-order mark at the very start of a
 * document is stripped by parsers, and the opening quote keeps it away from
 * position zero.
 */
function needsQuoting(field: string): boolean {
  if (field === '') return true;
  if (MUST_QUOTE.test(field)) return true;
  if (field !== field.trim()) return true;
  if (field.startsWith('\uFEFF')) return true;
  return false;
}

/** Wraps in double quotes when needed, doubling any embedded double quote. */
function serializeField(field: string): string {
  if (!needsQuoting(field)) return field;
  return `"${field.replace(/"/g, '""')}"`;
}

function serializeRecord(fields: readonly string[]): string {
  return fields.map(serializeField).join(',');
}

/**
 * Serializes a dataset to RFC 4180 CSV text: the header record followed by
 * every retained row, each record terminated by CRLF.
 *
 * Every record is CRLF-terminated, including the last, so appending a further
 * record is a pure concatenation and a trailing separator never has to be
 * special-cased. A parser reading the result must ignore the resulting final
 * empty line — the same blank-line handling it needs for hand-authored files.
 *
 * **Ragged rows.** A row shorter than the header list is padded with empty
 * fields to the header width. Requirement 1.12 compares retained row values,
 * and a short row emitted as-is would come back with a different arity. Empty
 * is the correct filler because `profiler.ts` already normalises an absent
 * cell to `''`, so the padded row is what the rest of the pipeline sees for
 * that dataset anyway. A row *longer* than the header list is emitted in full
 * rather than truncated: dropping fields would discard retained values, and
 * over-wide rows survive the round trip intact since the parser keeps every
 * field it reads and reports the arity mismatch as a parse issue.
 *
 * The input is only read — neither `headers` nor `rows` is mutated.
 */
export function serializeDataset(dataset: ParsedDataset): string {
  const width = dataset.headers.length;

  const records: string[] = [serializeRecord(dataset.headers)];

  for (const row of dataset.rows) {
    const padded =
      row.length >= width
        ? row
        : [...row, ...Array.from({ length: width - row.length }, () => '')];
    records.push(serializeRecord(padded));
  }

  return records.map((record) => `${record}${RECORD_SEPARATOR}`).join('');
}
