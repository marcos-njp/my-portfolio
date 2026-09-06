'use client';

// lib/data-profiler/use-profiler.ts
//
// The CSV Data Profiler's only stateful piece. Everything else in
// `lib/data-profiler/` is either a pure function over data or a thin IO adapter
// that reports failure as a value; this hook is what sequences them and decides
// what the page shows.
//
// **The nine fields and one discriminated `status`** come straight from
// design.md's Client State Machine section. They are held in a single
// `useReducer` rather than nine `useState` calls for one specific reason:
// Requirement 8.3 requires the whole discard list — dataset, profile, charts,
// narrative, issues, notice, chart errors — to be gone in one React commit, so
// no render can ever observe a half-cleared screen. Nine setters cannot promise
// that; one dispatch can.
//
// **Cancellation is two mechanisms, and both are required** (Requirement 8.7):
//
//   1. An `AbortController` per run, held in a ref. `reset()` aborts it, which
//      stops the papaparse chunk loop inside `parseCsvFile` and aborts the
//      `fetch` inside `loadSampleDataset` / `requestInsights`. This is what
//      stops work that is still running.
//   2. A monotonic `runId`, also held in a ref and incremented by every reset
//      and every load. Each async completion handler captured its own `runId`
//      and drops its result when the ref no longer matches. This is what stops
//      work that has already *finished*: a promise can resolve and have its
//      continuation queued as a microtask before `abort()` is called, at which
//      point the abort signal is useless — the value is already in hand. Only
//      the run guard rejects it.
//
// Completion handlers therefore check the run guard and nothing else. The
// signal is not re-read there; it would be a redundant second test of a
// condition the guard already covers, and having one gate makes it obvious
// which mechanism is responsible for correctness after the fact.
//
// **No persistence.** Every field lives in React state. No `localStorage`, no
// `sessionStorage`, no `IndexedDB`, no module-level cache — note the deliberate
// contrast with `lib/chat-store.ts`, which does persist. A reload therefore
// starts at `idle` with nothing restored (Requirements 8.5, 8.6).
//
// **Failures never blank the screen.** A load clears the previous results as
// its first step (Requirement 8.4), which would otherwise collide with the
// half-dozen criteria that require a failed load to retain what was on screen
// (1.4, 1.5, 1.9, 1.14, 1.15, 3.14, 4.11). The resolution is a snapshot: the
// results are stashed in a ref at load start and restored in the same single
// commit that sets the error message. So a successful load shows only the new
// dataset, and a failed one leaves the old one exactly as it was.
//
// _Requirements: 1.7, 1.11, 3.14, 4.11, 4.12, 5.10, 5.11, 5.12, 6.12, 8.1,
// 8.3, 8.4, 8.5, 8.6, 8.7_

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

import {
  askQuestion as sendQuestion,
  type AskFailure,
  type AskOutcome,
} from '@/lib/data-profiler/ask-client';
import { recommendCharts } from '@/lib/data-profiler/chart-recommender';
import {
  buildFactIndex,
  type FactIndex,
} from '@/lib/data-profiler/fact-index';
import {
  retrieveFacts,
  type RetrievedFacts,
} from '@/lib/data-profiler/fact-retriever';
import { validateQuestion, describeRejection } from '@/lib/data-profiler/question-validator';
import {
  MAX_RENDERED_RECOMMENDATIONS,
  READ_TIMEOUT_MS,
} from '@/lib/data-profiler/constants';
import {
  parseCsvFile,
  parseCsvText,
  type ParseOutcome,
  type ParseRejection,
} from '@/lib/data-profiler/csv-parse';
import { triggerDownload } from '@/lib/data-profiler/download';
import {
  requestInsights,
  type InsightFailure,
  type InsightOutcome,
} from '@/lib/data-profiler/insight-client';
import { buildInsightPayload } from '@/lib/data-profiler/insight-payload';
import type { InsightNarrative } from '@/lib/data-profiler/insight-schema';
import { attachQuality, profileDataset } from '@/lib/data-profiler/profiler';
import { scoreQuality } from '@/lib/data-profiler/quality-scorer';
import {
  REPORT_MIME_TYPES,
  reportFileName,
  toJsonReport,
  toMarkdownReport,
  type ReportFormat,
} from '@/lib/data-profiler/report-exporter';
import {
  loadSampleDataset,
  type SampleLoadFailure,
  type SampleLoadOutcome,
} from '@/lib/data-profiler/sample-loader';
import { inferColumnTypes } from '@/lib/data-profiler/type-inference';
import type {
  ChartSpec,
  ColumnType,
  DataProfile,
  ParseIssue,
  ParsedDataset,
} from '@/lib/data-profiler/types';

// --- State -------------------------------------------------------------------

/**
 * Where the machine is. `profiling` carries the column being processed so the
 * Requirement 3.14 message can name it; `error` carries the one message the UI
 * displays.
 *
 * `error` is deliberately non-destructive: it changes `status` and nothing
 * else, so a failed insight request or a failed export leaves the profile, the
 * charts and the score on screen (Requirements 6.11, 7.8) and the controls stay
 * activatable through the derived flags below rather than through the status.
 */
export type ProfilerStatus =
  | { kind: 'idle' }
  | { kind: 'reading'; percent: number }
  | { kind: 'parsing' }
  | { kind: 'profiling'; column: string }
  | { kind: 'profiled' }
  | { kind: 'insightPending' }
  /** A dataset question is in flight. Text may already be arriving. */
  | { kind: 'answering' }
  | { kind: 'error'; message: string };

/** Per-chart render failures, keyed by the chart's index in `charts` (Req 4.12). */
export type ChartErrorMap = Record<number, string>;

export interface ProfilerState {
  status: ProfilerStatus;
  dataset: ParsedDataset | null;
  profile: DataProfile | null;
  charts: ChartSpec[];
  narrative: InsightNarrative | null;
  issues: ParseIssue[];
  /** Row-cap notice (Req 1.7) and recommendation truncation count (Req 5.12). */
  notice: string | null;
  chartErrors: ChartErrorMap;
  /** The question currently being answered, or the one the answer belongs to. */
  askedQuestion: string | null;
  /** The answer text so far. Grows as the stream arrives, so it is never partial-looking. */
  answer: string | null;
  /** Which facts the answer was grounded in, for the provenance line. */
  retrieval: RetrievedFacts | null;
  runId: number;
}

/** The fields Requirement 8.3 discards together. */
type ProfilerResults = Omit<ProfilerState, 'status' | 'runId'>;

const EMPTY_RESULTS: ProfilerResults = {
  dataset: null,
  profile: null,
  charts: [],
  narrative: null,
  issues: [],
  notice: null,
  chartErrors: {},
  askedQuestion: null,
  answer: null,
  retrieval: null,
};

const INITIAL_STATE: ProfilerState = {
  ...EMPTY_RESULTS,
  status: { kind: 'idle' },
  runId: 0,
};

type ProfilerAction =
  /** Reset control, or unmount. Single-commit discard (Requirements 8.1, 8.3). */
  | { type: 'reset'; runId: number }
  /** First step of every load: same discard, new run (Requirement 8.4). */
  | { type: 'loadStart'; runId: number }
  | { type: 'progress'; percent: number }
  | { type: 'parsing' }
  | { type: 'profiling'; column: string }
  /**
   * A derivation finished. `errorMessage` is set only for the Requirement 4.11
   * case, where the profile is sound but no recommendation could be produced
   * and the previously rendered charts are carried across unchanged.
   */
  | {
      type: 'loaded';
      dataset: ParsedDataset;
      profile: DataProfile;
      charts: ChartSpec[];
      issues: ParseIssue[];
      notice: string | null;
      errorMessage?: string;
    }
  /** A load failed: restore the stashed results in the same commit as the message. */
  | { type: 'loadFailed'; message: string; restore: ProfilerResults }
  /** A non-destructive failure (insight, export): message only. */
  | { type: 'error'; message: string }
  | { type: 'insightStart' }
  | { type: 'insightDone'; narrative: InsightNarrative }
  /** A question was accepted and sent. Carries what the retriever chose. */
  | { type: 'askStart'; question: string; retrieval: RetrievedFacts }
  /** One chunk of the streamed answer. */
  | { type: 'askDelta'; chunk: string }
  | { type: 'askDone' }
  /** The question failed. The answer so far, if any, is kept (see the reducer). */
  | { type: 'askFailed'; message: string }
  /** Dismiss the answer without touching the profile. */
  | { type: 'askClear' }
  | { type: 'chartError'; index: number; message: string };

function reducer(state: ProfilerState, action: ProfilerAction): ProfilerState {
  switch (action.type) {
    case 'reset':
      return { ...EMPTY_RESULTS, status: { kind: 'idle' }, runId: action.runId };

    case 'loadStart':
      return {
        ...EMPTY_RESULTS,
        status: { kind: 'reading', percent: 0 },
        runId: action.runId,
      };

    case 'progress':
      // A progress callback that arrives after the read has moved on must not
      // drag the status backwards. The run guard already drops progress from a
      // discarded run; this covers the ordinary in-run race.
      if (state.status.kind !== 'reading') return state;
      if (state.status.percent === action.percent) return state;
      return { ...state, status: { kind: 'reading', percent: action.percent } };

    case 'parsing':
      return { ...state, status: { kind: 'parsing' } };

    case 'profiling':
      return { ...state, status: { kind: 'profiling', column: action.column } };

    case 'loaded':
      return {
        ...state,
        status:
          action.errorMessage === undefined
            ? { kind: 'profiled' }
            : { kind: 'error', message: action.errorMessage },
        dataset: action.dataset,
        profile: action.profile,
        charts: action.charts,
        narrative: null,
        issues: action.issues,
        notice: action.notice,
        chartErrors: {},
        // A new dataset invalidates any answer about the old one.
        askedQuestion: null,
        answer: null,
        retrieval: null,
      };

    case 'loadFailed':
      return {
        ...state,
        ...action.restore,
        status: { kind: 'error', message: action.message },
      };

    case 'error':
      return { ...state, status: { kind: 'error', message: action.message } };

    case 'insightStart':
      return { ...state, status: { kind: 'insightPending' } };

    case 'insightDone':
      return { ...state, status: { kind: 'profiled' }, narrative: action.narrative };

    case 'askStart':
      // The previous answer clears in the same commit that records the new
      // question, so the panel never shows an old answer under a new heading.
      return {
        ...state,
        status: { kind: 'answering' },
        askedQuestion: action.question,
        answer: null,
        retrieval: action.retrieval,
      };

    case 'askDelta':
      // Dropped unless a question is actually in flight. A chunk that arrives
      // after a failure or a clear has no answer to belong to.
      if (state.status.kind !== 'answering') return state;
      return { ...state, answer: (state.answer ?? '') + action.chunk };

    case 'askDone':
      if (state.status.kind !== 'answering') return state;
      return { ...state, status: { kind: 'profiled' } };

    case 'askFailed':
      // The partial answer is KEPT. A stream that dies halfway has already told
      // the visitor something true, and discarding it to show an error would
      // throw away the useful half of the response. The panel renders both.
      return { ...state, status: { kind: 'error', message: action.message } };

    case 'askClear':
      return { ...state, askedQuestion: null, answer: null, retrieval: null };

    case 'chartError':
      return {
        ...state,
        chartErrors: { ...state.chartErrors, [action.index]: action.message },
      };
  }
}

// --- Failure messages --------------------------------------------------------
//
// The three IO modules report failure as closed discriminated unions precisely
// so this layer can map them with switches the compiler checks for
// exhaustiveness. Adding a union member anywhere upstream fails the build here
// instead of silently rendering an empty string.

const SIZE_UNIT_MB = 'MB';

/**
 * Requirement 1.15. Split out of `describeParseRejection` so both switches stay
 * flat: a nested `switch` whose every arm returns leaves the outer `case` with
 * no reachable `break`, which reads like a fallthrough bug even when it is not.
 */
function describeHeaderRejection(reason: 'no-fields' | 'empty-name' | 'duplicate-name'): string {
  const requirement = 'The header row requires unique, non-empty field names.';
  switch (reason) {
    case 'no-fields':
      return `The first row contains no fields. ${requirement}`;
    case 'empty-name':
      return `The first row contains an empty field name. ${requirement}`;
    case 'duplicate-name':
      return `The first row contains duplicate field names. ${requirement}`;
  }
}

/** Requirements 1.4, 1.5, 1.9, 1.14, 1.15. Every kind gets a distinct sentence. */
export function describeParseRejection(rejection: ParseRejection): string {
  switch (rejection.kind) {
    case 'size':
      return `That file is ${rejection.sizeMb} ${SIZE_UNIT_MB}, which exceeds the ${rejection.capMb} ${SIZE_UNIT_MB} limit. Choose a smaller CSV file.`;
    case 'extension':
      return 'Only files with the .csv extension are accepted.';
    case 'empty':
      return 'That file contains no data rows.';
    case 'header':
      return describeHeaderRejection(rejection.reason);
    case 'read':
      return rejection.reason === 'timeout'
        ? `That file could not be read within ${Math.round(READ_TIMEOUT_MS / 1000)} seconds. Reading was stopped.`
        : 'That file could not be read.';
  }
}

/** `aborted` is mapped for exhaustiveness only; a discarded load is never shown. */
export function describeSampleFailure(failure: SampleLoadFailure): string {
  switch (failure.kind) {
    case 'unknown-id':
      return `"${failure.id}" is not one of the bundled sample datasets.`;
    case 'http':
      return `That sample dataset could not be loaded (HTTP ${failure.status}).`;
    case 'network':
      return 'That sample dataset could not be loaded. Check your connection and try again.';
    case 'aborted':
      return 'Loading the sample dataset was cancelled.';
  }
}

/**
 * Requirements 6.11 and 6.13. For `http` and `rate-limit` the server's own
 * message is displayed verbatim, which is what 6.11 asks for.
 */
export function describeInsightFailure(failure: InsightFailure): string {
  switch (failure.kind) {
    case 'http':
    case 'rate-limit':
      return failure.message;
    case 'invalid-response':
      return 'The insight narrative could not be generated. The service returned a response that failed validation.';
    case 'timeout':
      return `The insight request timed out after ${Math.round(failure.timeoutMs / 1000)} seconds. Nothing else on this page was affected.`;
    case 'aborted':
      return 'The insight request was cancelled.';
    case 'network':
      return 'The insight request could not be sent. Check your connection and try again.';
  }
}

const REPORT_FORMAT_LABELS: Record<ReportFormat, string> = {
  markdown: 'Markdown',
  json: 'JSON',
};

/** Requirement 7.8: name the format and state that nothing was saved. */
function describeExportFailure(format: ReportFormat): string {
  return `The ${REPORT_FORMAT_LABELS[format]} report could not be produced, so no file was saved. Your results are unchanged.`;
}

// --- Notices -----------------------------------------------------------------

/** The five values a `ColumnType` may take; anything else counts as absent (Req 4.11). */
const KNOWN_COLUMN_TYPES: readonly ColumnType[] = [
  'numeric',
  'categorical',
  'datetime',
  'identifier',
  'unknown',
];

/**
 * Builds the info-level notice, which carries two independent facts:
 * the row cap (Requirement 1.7) and the recommendation display cap
 * (Requirement 5.12). Both, one, or neither may apply.
 */
function buildNotice(dataset: ParsedDataset, profile: DataProfile): string | null {
  const parts: string[] = [];

  if (dataset.totalRowCount > dataset.retainedRowCount) {
    parts.push(
      `This file contains ${dataset.totalRowCount.toLocaleString('en-US')} data rows. The first ${dataset.retainedRowCount.toLocaleString('en-US')} were retained for profiling and the rest were discarded.`,
    );
  }

  const total = profile.quality.recommendations.length;
  if (total > MAX_RENDERED_RECOMMENDATIONS) {
    parts.push(
      `${total} cleaning recommendations were produced. The first ${MAX_RENDERED_RECOMMENDATIONS} are shown; ${total - MAX_RENDERED_RECOMMENDATIONS} are not displayed.`,
    );
  }

  return parts.length === 0 ? null : parts.join(' ');
}

/**
 * Requirement 4.11's precondition: no profile, or no column carrying a usable
 * `ColumnType`. A column typed `unknown` *is* typed — it simply earns no chart —
 * so it does not trip this. Mirrors the guard inside `recommendCharts`, which
 * returns `[]` for the same input; this function is what turns that empty list
 * into the error message 4.11 requires, as opposed to Requirement 4.8's
 * ordinary "nothing here is chartable" case.
 */
function recommendationsUnavailable(profile: DataProfile): boolean {
  const columns = profile.columns ?? [];
  if (columns.length === 0) return true;
  return !columns.some(
    (column) => column !== null && column !== undefined && KNOWN_COLUMN_TYPES.includes(column.type),
  );
}

/**
 * Yields to the browser between the parse and the profiling pass.
 *
 * `profileDataset` is synchronous and, at the 50,000-row cap, long enough that
 * without a macrotask boundary React would batch the `parsing` and `profiling`
 * dispatches into the same commit — the visitor would see the progress bar sit
 * at 100% and then jump straight to results, with no indication that anything
 * is happening during the longest part of the work. A microtask (`await
 * Promise.resolve()`) does not help: React's automatic batching flushes at the
 * end of the task, so the intermediate status would still never paint.
 */
function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * Maps an `AskFailure` onto the sentence the panel shows.
 *
 * Exhaustive by the same convention as `describeInsightFailure`: adding a
 * failure arm in `ask-client.ts` fails the build here rather than rendering an
 * empty string.
 */
export function describeAskFailure(failure: AskFailure): string {
  switch (failure.kind) {
    case 'rejected':
      // The route already produced a specific sentence; prefer it.
      return failure.message;
    case 'rate-limit':
      return failure.message;
    case 'http':
      return failure.message;
    case 'empty-stream':
      return 'The answer could not be generated. Try asking again.';
    case 'timeout':
      return `The answer took longer than ${Math.round(failure.timeoutMs / 1000)} seconds and was stopped. Try a narrower question.`;
    case 'aborted':
      return 'The question was cancelled.';
    case 'network':
      return 'The question could not be sent. Check your connection and try again.';
  }
}

// --- Hook --------------------------------------------------------------------

export interface ProfilerController {
  state: ProfilerState;
  /**
   * The retrievable facts for the current profile, or null before one exists.
   *
   * Built here rather than in the component because it is derived state, and
   * exposed because the ask panel shows its size ("12 of 570 facts"). Building
   * it costs no request: `buildFactIndex` is pure, which is what keeps the
   * privacy test's "profiling issues no request at all" assertion true.
   */
  factIndex: FactIndex | null;
  /** True once a question can be asked and none is in flight. */
  canAsk: boolean;
  askQuestion(question: string): void;
  clearAnswer(): void;
  /** Requirement 8.1: true once there is something to discard. */
  canReset: boolean;
  /** Requirement 9.7 / 6.12: the insight control's enabled state. */
  canRequestNarrative: boolean;
  /** Requirement 7.7: the export controls' enabled state. */
  canExport: boolean;
  selectFile(file: File): void;
  selectSample(id: string): void;
  requestNarrative(): void;
  exportReport(format: ReportFormat): void;
  reset(): void;
  reportChartError(index: number, message: string): void;
}

/**
 * Owns every piece of profiler state and every transition between them.
 *
 * The three async entry points (`selectFile`, `selectSample`,
 * `requestNarrative`) are fire-and-forget: they start a run, return
 * immediately, and let the reducer publish the outcome. None of them return a
 * promise, because a component has nothing useful to do with one — the state is
 * the result — and returning one would invite a caller to `await` a run that a
 * reset may have already discarded.
 *
 * `exportReport` is synchronous: serialization is a pure string build and
 * `triggerDownload` hands the blob to the browser in the same tick, so there is
 * no pending window to model.
 */
export function useProfiler(): ProfilerController {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  /**
   * The authoritative run id. State carries a copy for rendering, but the ref
   * is what completion handlers compare against: it is updated synchronously at
   * the moment of a reset or a load, whereas the state copy only appears after
   * React commits — far too late to gate a promise that has already resolved.
   */
  const runIdRef = useRef(0);

  /** The current run's controller. `reset()` aborts it; a new load replaces it. */
  const abortRef = useRef<AbortController | null>(null);

  /**
   * The latest committed state, for the handlers that need to read it without
   * being re-created on every change. Written after commit, which is early
   * enough: every reader runs from a user event or an async completion, both of
   * which necessarily follow a commit.
   */
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  /** Results stashed at load start, restored if the load fails. See the header. */
  const retainedRef = useRef<ProfilerResults>(EMPTY_RESULTS);

  /** True while the given run is still the current one (Requirement 8.7). */
  const isCurrentRun = useCallback((runId: number) => runIdRef.current === runId, []);

  /** Copies what is on screen into `retainedRef` before a load clears it. */
  const stashResults = useCallback(() => {
    const {
      dataset,
      profile,
      charts,
      narrative,
      issues,
      notice,
      chartErrors,
      askedQuestion,
      answer,
      retrieval,
    } = stateRef.current;
    retainedRef.current = {
      dataset,
      profile,
      charts,
      narrative,
      issues,
      notice,
      chartErrors,
      askedQuestion,
      answer,
      retrieval,
    };
  }, []);

  /** Aborts any in-flight work and claims the next run id. */
  const beginRun = useCallback((): { runId: number; signal: AbortSignal } => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    runIdRef.current += 1;
    return { runId: runIdRef.current, signal: controller.signal };
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    runIdRef.current += 1;
    retainedRef.current = EMPTY_RESULTS;
    dispatch({ type: 'reset', runId: runIdRef.current });
  }, []);

  // Unmount: abort in-flight work and burn the run id so no queued continuation
  // can dispatch into an unmounted tree.
  useEffect(
    () => () => {
      abortRef.current?.abort();
      abortRef.current = null;
      runIdRef.current += 1;
    },
    [],
  );

  /** One commit: the error message plus the results the load had cleared. */
  const failLoad = useCallback((message: string) => {
    dispatch({ type: 'loadFailed', message, restore: retainedRef.current });
  }, []);

  /**
   * The derivation pipeline, shared by both intake paths: infer types, profile,
   * score, attach, recommend. Every step is pure and every one is inside the
   * `try`, because Requirement 3.14 asks for one message naming the column in
   * progress rather than five differently-shaped failures.
   */
  const deriveAndPublish = useCallback(
    async (dataset: ParsedDataset, runId: number) => {
      dispatch({ type: 'parsing' });
      await yieldToBrowser();
      if (!isCurrentRun(runId)) return;

      // `profileDataset` is one opaque call, so the column named in a 3.14
      // failure is the one the status announced: the first header. Naming a
      // column the visitor can see beats naming none.
      const firstColumn = dataset.headers[0] ?? '';
      dispatch({ type: 'profiling', column: firstColumn });
      await yieldToBrowser();
      if (!isCurrentRun(runId)) return;

      let profile: DataProfile;
      let charts: ChartSpec[];
      try {
        const types = inferColumnTypes(dataset);
        const core = profileDataset(dataset, types);
        profile = attachQuality(core, scoreQuality(core));
        charts = recommendCharts(profile, dataset);
      } catch {
        if (!isCurrentRun(runId)) return;
        // Requirement 3.14: no profile is produced, the message names the
        // column being processed, and the previous profile is restored.
        failLoad(
          firstColumn === ''
            ? 'The profile could not be computed for that dataset.'
            : `The profile could not be computed. Processing stopped at column "${firstColumn}".`,
        );
        return;
      }

      if (!isCurrentRun(runId)) return;

      // Requirement 4.11: the profile stands, but no recommendation is
      // possible — say so and leave the previously rendered charts untouched.
      if (recommendationsUnavailable(profile)) {
        dispatch({
          type: 'loaded',
          dataset,
          profile,
          charts: retainedRef.current.charts,
          issues: dataset.issues,
          notice: buildNotice(dataset, profile),
          errorMessage:
            'Chart recommendations cannot be produced for this dataset because no column type could be determined.',
        });
        return;
      }

      dispatch({
        type: 'loaded',
        dataset,
        profile,
        charts,
        // Requirement 1.11: the UI shows the issue count and the first ten row
        // indices alongside the profile, which is displayed regardless.
        issues: dataset.issues,
        notice: buildNotice(dataset, profile),
      });
    },
    [failLoad, isCurrentRun],
  );

  const selectFile = useCallback(
    (file: File) => {
      const { runId, signal } = beginRun();
      stashResults();
      dispatch({ type: 'loadStart', runId });

      void (async () => {
        const handlers = {
          onProgress: (percent: number) => {
            if (!isCurrentRun(runId)) return;
            dispatch({ type: 'progress', percent });
          },
        };

        // `parseCsvFile` reports every failure as a value and documents that it
        // never rejects, so the `catch` is only here because an adapter that
        // throws must not become an unhandled rejection that leaves the UI
        // stuck on the progress bar.
        let outcome: ParseOutcome;
        try {
          outcome = await parseCsvFile(file, handlers, signal);
        } catch {
          outcome = { ok: false, rejection: { kind: 'read', reason: 'io' } };
        }

        if (!isCurrentRun(runId)) return;

        if (!outcome.ok) {
          failLoad(describeParseRejection(outcome.rejection));
          return;
        }

        await deriveAndPublish(outcome.dataset, runId);
      })();
    },
    [beginRun, deriveAndPublish, failLoad, isCurrentRun, stashResults],
  );

  const selectSample = useCallback(
    (id: string) => {
      const { runId, signal } = beginRun();
      stashResults();
      dispatch({ type: 'loadStart', runId });

      void (async () => {
        let outcome: SampleLoadOutcome;
        try {
          outcome = await loadSampleDataset(id, signal);
        } catch {
          outcome = { ok: false, failure: { kind: 'network', url: id } };
        }

        if (!isCurrentRun(runId)) return;

        if (!outcome.ok) {
          // A discarded load is never displayed, and the run guard above has
          // already dropped the common case; this covers an abort raised by
          // something other than a reset.
          if (outcome.failure.kind === 'aborted') return;
          failLoad(describeSampleFailure(outcome.failure));
          return;
        }

        // The sample's display label is the dataset's source name, so the
        // report file name and every heading read as the visitor selected it.
        const parsed = parseCsvText(outcome.csvText, outcome.sample.label);
        if (!isCurrentRun(runId)) return;

        if (!parsed.ok) {
          failLoad(describeParseRejection(parsed.rejection));
          return;
        }

        await deriveAndPublish(parsed.dataset, runId);
      })();
    },
    [beginRun, deriveAndPublish, failLoad, isCurrentRun, stashResults],
  );

  const requestNarrative = useCallback(() => {
    const current = stateRef.current;

    // Requirement 6.12: further activations while a request is in flight do
    // nothing at all — not a queued second request, not a replaced one.
    if (current.status.kind === 'insightPending') return;

    if (current.profile === null) {
      dispatch({
        type: 'error',
        message: 'Profile a dataset before requesting an insight narrative.',
      });
      return;
    }

    const payload = buildInsightPayload(current.profile);
    if (payload === null) {
      dispatch({
        type: 'error',
        message: 'This profile has no columns, so no insight request could be built.',
      });
      return;
    }

    // The insight request belongs to the *current* run: it is derived from the
    // dataset already loaded, so it shares that run's id and controller. It
    // must not call `beginRun`, which would abort the controller it is about to
    // use and invalidate its own completion handler.
    const controller = abortRef.current ?? new AbortController();
    abortRef.current = controller;
    const runId = runIdRef.current;

    dispatch({ type: 'insightStart' });

    void (async () => {
      let outcome: InsightOutcome;
      try {
        outcome = await requestInsights(payload, controller.signal);
      } catch {
        outcome = { ok: false, failure: { kind: 'network' } };
      }

      if (!isCurrentRun(runId)) return;

      if (!outcome.ok) {
        if (outcome.failure.kind === 'aborted') return;
        // Requirements 6.11 and 6.13: the message is shown, the profile,
        // charts and score stay exactly as they are, and the control becomes
        // activatable again because `status` is no longer `insightPending`.
        dispatch({ type: 'error', message: describeInsightFailure(outcome.failure) });
        return;
      }

      dispatch({ type: 'insightDone', narrative: outcome.narrative });
    })();
  }, [isCurrentRun]);

  const exportReport = useCallback((format: ReportFormat) => {
    const current = stateRef.current;
    if (current.profile === null) {
      dispatch({
        type: 'error',
        message: 'Profile a dataset before exporting a report.',
      });
      return;
    }

    // The exporters are pure, so the clock lives here — this is the only place
    // in the export path that is allowed to read it.
    const exportedAt = new Date();
    const input = { profile: current.profile, narrative: current.narrative, exportedAt };

    try {
      const text = format === 'markdown' ? toMarkdownReport(input) : toJsonReport(input);
      triggerDownload(
        reportFileName(current.profile.sourceName, exportedAt, format),
        REPORT_MIME_TYPES[format],
        text,
      );
    } catch {
      // Requirement 7.8: name the format, keep every result, re-enable the
      // control. `error` touches `status` only, so all three follow.
      dispatch({ type: 'error', message: describeExportFailure(format) });
    }
  }, []);

  const reportChartError = useCallback((index: number, message: string) => {
    dispatch({ type: 'chartError', index, message });
  }, []);

  /**
   * The retrievable index, rebuilt whenever the profile or the charts change.
   *
   * A `useMemo` and not reducer state: it is a pure function of two fields
   * already in state, and storing it would give the same information two owners
   * that could disagree.
   */
  const factIndex = useMemo(
    () => (state.profile === null ? null : buildFactIndex(state.profile, state.charts)),
    [state.profile, state.charts],
  );

  const factIndexRef = useRef(factIndex);
  useEffect(() => {
    factIndexRef.current = factIndex;
  }, [factIndex]);

  const clearAnswer = useCallback(() => {
    dispatch({ type: 'askClear' });
  }, []);

  const askQuestion = useCallback(
    (question: string) => {
      const current = stateRef.current;

      // A second activation while one is in flight does nothing, matching
      // `requestNarrative`: no queued request, no replaced one.
      if (current.status.kind === 'answering') return;

      if (current.profile === null) {
        dispatch({ type: 'error', message: 'Profile a dataset before asking about it.' });
        return;
      }

      // Screened in the browser as well as on the server. The server check is
      // the one that matters (a client check is only advice), but doing it here
      // too turns a typo into instant feedback instead of a round trip.
      const check = validateQuestion(question);
      if (!check.ok) {
        dispatch({
          type: 'error',
          message: describeRejection(check.reason ?? 'empty'),
        });
        return;
      }

      const index = factIndexRef.current;
      if (index === null || index.facts.length === 0) {
        dispatch({
          type: 'error',
          message: 'This profile produced no facts to answer from.',
        });
        return;
      }

      const retrieval = retrieveFacts(index, check.cleaned);
      if (retrieval.facts.length === 0) {
        dispatch({
          type: 'error',
          message: 'Nothing in the profile matched that question. Try naming a column.',
        });
        return;
      }

      // Like the insight request, this belongs to the run that loaded the
      // dataset: it shares that run's id and controller and must not call
      // `beginRun`, which would abort the controller it is about to use.
      const controller = abortRef.current ?? new AbortController();
      abortRef.current = controller;
      const runId = runIdRef.current;

      dispatch({ type: 'askStart', question: check.cleaned, retrieval });

      void (async () => {
        let outcome: AskOutcome;
        try {
          outcome = await sendQuestion(
            {
              question: check.cleaned,
              // Only the rendered text crosses the wire. `terms` and `columns`
              // are retrieval aids the server has no use for.
              facts: retrieval.facts.map((fact) => ({
                id: fact.id,
                kind: fact.kind,
                text: fact.text,
              })),
              totalFacts: retrieval.totalFacts,
              columnCount: current.profile === null ? 0 : current.profile.columns.length,
              rowCount: current.profile === null ? 0 : current.profile.retainedRowCount,
            },
            (chunk) => {
              if (!isCurrentRun(runId)) return;
              dispatch({ type: 'askDelta', chunk });
            },
            controller.signal,
          );
        } catch {
          outcome = { ok: false, failure: { kind: 'network' } };
        }

        if (!isCurrentRun(runId)) return;

        if (!outcome.ok) {
          if (outcome.failure.kind === 'aborted') return;
          dispatch({ type: 'askFailed', message: describeAskFailure(outcome.failure) });
          return;
        }

        dispatch({ type: 'askDone' });
      })();
    },
    [isCurrentRun],
  );

  const derived = useMemo(() => {
    const busyLoading =
      state.status.kind === 'reading' ||
      state.status.kind === 'parsing' ||
      state.status.kind === 'profiling';

    return {
      // Requirement 8.1 / 8.2: offer the reset control once there is state to
      // discard, including a load in progress and a bare error message.
      canReset: state.dataset !== null || busyLoading || state.status.kind === 'error',
      canRequestNarrative: state.profile !== null && state.status.kind !== 'insightPending',
      canExport: state.profile !== null,
      canAsk: state.profile !== null && state.status.kind !== 'answering',
    };
  }, [state.dataset, state.profile, state.status]);

  return {
    state,
    ...derived,
    factIndex,
    selectFile,
    selectSample,
    requestNarrative,
    askQuestion,
    clearAnswer,
    exportReport,
    reset,
    reportChartError,
  };
}
