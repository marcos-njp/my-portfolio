// lib/data-profiler/profiler.ts
//
// Statistical profiling. Pure module: total, deterministic, no ambient clock,
// no randomness, no input mutation. Every statistic is delegated to `stats.ts`
// and every value classification to `values.ts` — nothing is reimplemented here.
//
// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.13, 3.15

import { MAX_CORRELATION_COLUMNS, MAX_TOP_VALUES } from './constants';
import {
  countOutliers,
  mean,
  outlierBounds,
  pearson,
  quantile,
  round6,
  stdDev,
} from './stats';
import type {
  CategoricalStats,
  ColumnProfile,
  ColumnType,
  CorrelationPair,
  DataProfile,
  DatetimeStats,
  NumericStats,
  ParsedDataset,
} from './types';
import { isNullish, parseAcceptedDate, parseFiniteNumber } from './values';

/**
 * A `DataProfile` before the quality scorer has run.
 *
 * `DataProfile.quality` is a `QualityResult`, which is produced by
 * `quality-scorer.ts` — a module that reads a profile as its *input*. Making
 * `profileDataset` return the whole `DataProfile` would therefore invert the
 * dependency and force this module to import the scorer, which is both a cycle
 * in intent and a second responsibility for a function whose contract is
 * Requirement 3 only.
 *
 * So `profileDataset` returns `ProfileCore` and the caller completes it:
 *
 * ```ts
 * const core = profileDataset(dataset, types);
 * const profile = attachQuality(core, scoreQuality(core));
 * ```
 *
 * `scoreQuality` reads only fields present on `ProfileCore`, so it can be typed
 * to accept `ProfileCore` and a full `DataProfile` still satisfies it
 * structurally. Nothing in this file needs to change when task 6.1 lands.
 */
export type ProfileCore = Omit<DataProfile, 'quality'>;

/**
 * Completes a `ProfileCore` into a `DataProfile`. Returns a new object; the
 * input is not mutated.
 */
export function attachQuality(
  core: ProfileCore,
  quality: DataProfile['quality'],
): DataProfile {
  return { ...core, quality };
}

// --- Accumulators ------------------------------------------------------------

/**
 * Per-column state for the single row pass. Only the fields the column's
 * inferred type actually needs are allocated; the rest stay `null`.
 *
 * **Retained numeric representation.** Quartiles, outliers and correlation all
 * need the values, not just running moments, so numeric values are retained.
 * Two representations are in play:
 *
 * - `aligned: Float64Array` — one slot per retained row, `NaN` marking "no
 *   numeric value in this row". Allocated **only** for the numeric columns that
 *   can appear in a correlation pair (the first `MAX_CORRELATION_COLUMNS` in
 *   header order). Pairwise-complete correlation has to know *which row* a value
 *   came from, and a row-aligned array answers that in O(1) by index, so the
 *   pairwise pass is a straight dual index walk with no intersection logic.
 * - `numericValues: number[]` — compacted, no row identity. Used for every
 *   other numeric column, which only ever needs order statistics.
 *
 * The tradeoff: the aligned form costs 8 bytes per retained row per column
 * regardless of how sparse the column is (≤30 × 50,000 × 8 B ≈ 12 MB at the
 * Requirement 3.1 worst case), where the compacted form costs only as much as
 * there are values but would require carrying a parallel row-index array and
 * merging two sorted index lists per pair. The alternative — recomputing pairs
 * from `dataset.rows` — would re-read and re-parse the row matrix up to 435
 * times, which is exactly the cost the design's single-pass approach exists to
 * avoid. A `Float64Array` was chosen over `(number | null)[]` because it is a
 * flat 8-bytes-per-slot buffer rather than a pointer array, and `NaN` is
 * unambiguous as a hole: `parseFiniteNumber` rejects `NaN`, so no genuine value
 * can ever be `NaN`.
 *
 * Sorted order statistics for an aligned column are taken from a compacted copy
 * built once at finalize time, so the aligned buffer is the only per-row
 * allocation.
 */
interface ColumnAccumulator {
  nullCount: number;
  nonNullCount: number;
  distinct: Set<string>;

  /** Compacted parsed numbers. Numeric columns outside the correlation window. */
  numericValues: number[] | null;
  /** Row-aligned parsed numbers, `NaN` = hole. Correlation-window numeric columns. */
  aligned: Float64Array | null;

  /** Value frequencies. Categorical columns only. */
  freq: Map<string, number> | null;

  /** Datetime columns only. */
  minDateMs: number | null;
  maxDateMs: number | null;
  unparsedDateCount: number;
}

function newAccumulator(
  type: ColumnType,
  rowCount: number,
  inCorrelationWindow: boolean,
): ColumnAccumulator {
  const acc: ColumnAccumulator = {
    nullCount: 0,
    nonNullCount: 0,
    distinct: new Set<string>(),
    numericValues: null,
    aligned: null,
    freq: null,
    minDateMs: null,
    maxDateMs: null,
    unparsedDateCount: 0,
  };

  if (type === 'numeric') {
    if (inCorrelationWindow && rowCount > 0) {
      acc.aligned = new Float64Array(rowCount).fill(NaN);
    } else {
      acc.numericValues = [];
    }
  } else if (type === 'categorical') {
    acc.freq = new Map<string, number>();
  }

  return acc;
}

// --- Finalizers --------------------------------------------------------------

/**
 * Ascending sorted copy of the parsed numeric values. Never sorts in place:
 * `aligned` is compacted into a fresh array and `numericValues` is copied
 * before sorting.
 */
function sortedNumericValues(acc: ColumnAccumulator): number[] {
  if (acc.aligned !== null) {
    const out: number[] = [];
    for (let i = 0; i < acc.aligned.length; i += 1) {
      const v = acc.aligned[i];
      if (!Number.isNaN(v)) out.push(v);
    }
    out.sort((a, b) => a - b);
    return out;
  }
  if (acc.numericValues !== null) {
    return acc.numericValues.slice().sort((a, b) => a - b);
  }
  return [];
}

/**
 * Numeric statistics over the non-null values **that parse as finite numbers**.
 *
 * Requirement 2.2 assigns `numeric` at a 95% parse rate, so a numeric column may
 * hold up to 5% non-null values with no numeric position. Those cannot
 * contribute to a minimum, a quantile or a standard deviation, so the
 * statistics are computed over the parseable subset — exactly as Requirement
 * 3.3 words it ("over the non-null values of that column which parse as finite
 * numbers").
 *
 * Quartiles come from `quantile` on the sorted copy, so
 * `min <= q1 <= median <= q3 <= max` (Requirement 3.10) holds by construction;
 * `round6` is monotonic non-decreasing and applied afterwards, so it cannot
 * invert that ordering.
 *
 * Outlier fences are derived from the **unrounded** quartiles and the count is
 * taken against those, so the count is not perturbed by display rounding; the
 * bounds are then rounded for recording (Requirement 5.5 names them).
 *
 * Returns `null` when no value parsed, in which case the caller omits the block
 * — there is no honest number to record.
 */
function finalizeNumeric(acc: ColumnAccumulator): NumericStats | null {
  const sorted = sortedNumericValues(acc);
  const n = sorted.length;
  if (n === 0) return null;

  const q1 = quantile(sorted, 0.25);
  const median = quantile(sorted, 0.5);
  const q3 = quantile(sorted, 0.75);
  const bounds = outlierBounds(q1, q3);

  return {
    min: round6(sorted[0]),
    max: round6(sorted[n - 1]),
    mean: round6(mean(sorted)),
    median: round6(median),
    stdDev: round6(stdDev(sorted)),
    q1: round6(q1),
    q3: round6(q3),
    outlierCount: countOutliers(sorted, bounds),
    lowerBound: round6(bounds.lowerBound),
    upperBound: round6(bounds.upperBound),
  };
}

/**
 * Case-sensitive code-unit comparison. `localeCompare` is deliberately avoided:
 * it is locale-dependent and would make the Requirement 3.4 tie-break
 * environment-sensitive, breaking Requirement 3.12's determinism.
 */
function compareStrings(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * At most `MAX_TOP_VALUES` most frequent values, ordered by descending count
 * with ties broken by ascending case-sensitive string comparison
 * (Requirement 3.4). A column with fewer than `MAX_TOP_VALUES` distinct values
 * yields all of them, since the slice is a cap rather than a fill.
 *
 * A full sort of the distinct values is O(d log d) and `d` is bounded by the
 * non-null count; a selection algorithm would be faster asymptotically but the
 * comparator is the whole specification of the ordering here, so sorting keeps
 * the tie-break auditable.
 */
function finalizeCategorical(acc: ColumnAccumulator): CategoricalStats | null {
  if (acc.freq === null) return null;

  const entries: Array<{ value: string; count: number }> = [];
  acc.freq.forEach((count, value) => {
    entries.push({ value, count });
  });
  if (entries.length === 0) return null;

  entries.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return compareStrings(a.value, b.value);
  });

  return { topValues: entries.slice(0, MAX_TOP_VALUES) };
}

/**
 * UTC epoch milliseconds to an ISO 8601 UTC string, or `null` when the value is
 * out of the representable range. `parseAcceptedDate` only ever returns years
 * 1–9999, so the guard is defence in depth that keeps this function total —
 * `toISOString` throws on an invalid date.
 */
function isoFromMs(ms: number): string | null {
  if (!Number.isFinite(ms)) return null;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return d.toISOString();
  } catch {
    return null;
  }
}

/**
 * Earliest and latest parsed date plus the count of non-null values that failed
 * to parse (Requirement 3.5).
 *
 * Returns `null` when no value parsed. Requirement 3.5 defines earliest and
 * latest over "the non-null values which parse as dates in the
 * Accepted_Date_Formats", which is vacuous for such a column, and
 * `DatetimeStats` has no representation for an absent extremum — so the block
 * is omitted rather than filled with a fabricated date. `nullCount`,
 * `nonNullCount` and `distinctCount` are still recorded, and `statsComputed`
 * stays `true`, because Requirement 3.13's not-computed marking is scoped to
 * `nonNullCount === 0`.
 */
function finalizeDatetime(acc: ColumnAccumulator): DatetimeStats | null {
  if (acc.minDateMs === null || acc.maxDateMs === null) return null;

  const earliest = isoFromMs(acc.minDateMs);
  const latest = isoFromMs(acc.maxDateMs);
  if (earliest === null || latest === null) return null;

  return { earliest, latest, unparsedCount: acc.unparsedDateCount };
}

// --- Correlation -------------------------------------------------------------

/** A numeric column eligible to appear in a correlation pair. */
interface CorrelationCandidate {
  name: string;
  values: Float64Array;
}

/**
 * Pairwise-complete Pearson correlation over the candidate columns.
 *
 * Candidates are the first `MAX_CORRELATION_COLUMNS` numeric columns in header
 * order (Requirement 3.7) minus any whose recorded standard deviation is 0
 * (Requirement 3.8) — excluded up front so no pair involving them is even
 * attempted. `pearson` also returns `null` on zero variance, but relying on
 * that alone would emit no pair while still paying for the pass.
 *
 * For each unordered pair, rows where both slots hold a parsed number are
 * collected and handed to `pearson`, which requires `n >= 3` and returns `null`
 * when the coefficient is undefined. Fewer than two candidates yields `[]`
 * (Requirement 3.15) without allocating anything.
 *
 * Ordering: descending `|coefficient|`, ties by ascending `columnA` then
 * ascending `columnB`. Sorted on a fresh array.
 */
function computeCorrelations(candidates: CorrelationCandidate[]): CorrelationPair[] {
  const pairs: CorrelationPair[] = [];
  if (candidates.length < 2) return pairs;

  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      const a = candidates[i];
      const b = candidates[j];
      const rowCount = Math.min(a.values.length, b.values.length);

      const xs: number[] = [];
      const ys: number[] = [];
      for (let r = 0; r < rowCount; r += 1) {
        const x = a.values[r];
        const y = b.values[r];
        if (Number.isNaN(x) || Number.isNaN(y)) continue;
        xs.push(x);
        ys.push(y);
      }

      // `pearson` enforces n >= 3 and returns null on a zero denominator.
      const coefficient = pearson(xs, ys);
      if (coefficient === null) continue;

      pairs.push({ columnA: a.name, columnB: b.name, coefficient });
    }
  }

  pairs.sort((p, q) => {
    const byMagnitude = Math.abs(q.coefficient) - Math.abs(p.coefficient);
    if (byMagnitude !== 0) return byMagnitude;
    const byA = compareStrings(p.columnA, q.columnA);
    if (byA !== 0) return byA;
    return compareStrings(p.columnB, q.columnB);
  });

  return pairs;
}

// --- Entry point -------------------------------------------------------------

/**
 * Computes a `ProfileCore` from a `ParsedDataset` and its `ColumnType`
 * assignments.
 *
 * One `ColumnProfile` per column in header position order (Requirement 3.1).
 * Column types are read positionally from `types`; a missing entry is treated
 * as `'unknown'`, which records the counts and omits every type-specific block.
 *
 * **Single pass.** The rows are traversed exactly once. Per cell the work is: a
 * nullish test, a `Set.add` for the distinct count, and *only* the type-specific
 * step the column's accumulator was allocated for — a number parse for numeric,
 * a `Map` bump for categorical, a date parse for datetime, nothing at all for
 * `identifier` and `unknown`. The duplicate-row key for the row is assembled
 * from the same normalized cells, so duplicate detection adds no extra
 * traversal. Order statistics are sorted once per numeric column afterwards, and
 * correlation reads the retained aligned arrays rather than the row matrix.
 *
 * **`retainedRowCount` is `dataset.rows.length`**, not `dataset.retainedRowCount`.
 * The two agree for anything the parser produces, but deriving it from the array
 * actually iterated is what makes Requirement 3.9 (`nullCount + nonNullCount ===
 * retainedRowCount`, for every column) hold structurally rather than depending
 * on a caller-supplied field being consistent.
 *
 * **`MAX_PROFILE_COLUMNS` is not enforced here.** The 200-column figure in
 * Requirement 3.1 bounds the input size for which the 10-second budget is
 * promised; it is not a licence to drop columns. Truncating would directly
 * violate 3.1's "exactly one Column_Profile per column" and leave 3.9
 * unverifiable for the dropped columns. A dataset wider than the cap is profiled
 * in full, simply without a performance guarantee — and the width limit that
 * does have observable semantics is `MAX_INFER_COLUMNS` in `type-inference.ts`,
 * which already degrades over-wide datasets to `unknown` types, so such columns
 * arrive here carrying no type-specific work anyway. Enforcement of
 * `MAX_PROFILE_COLUMNS` belongs to the UI/payload layer (Requirement 6.2 caps
 * the insight payload at 200 columns).
 *
 * Pure: no ambient clock, no randomness, and neither `dataset` nor `types` is
 * mutated — every sort runs on a copy.
 */
export function profileDataset(
  dataset: ParsedDataset,
  types: readonly ColumnType[],
): ProfileCore {
  const headers = dataset.headers ?? [];
  const columnCount = headers.length;
  const rows = dataset.rows ?? [];
  const rowCount = rows.length;

  const totalRowCount =
    Number.isFinite(dataset.totalRowCount) && dataset.totalRowCount > rowCount
      ? dataset.totalRowCount
      : rowCount;

  // Correlation window: the first MAX_CORRELATION_COLUMNS numeric columns in
  // header order. Resolved before the pass so accumulators know which
  // representation to allocate (Requirement 3.7).
  const columnTypes: ColumnType[] = new Array<ColumnType>(columnCount);
  const inWindow: boolean[] = new Array<boolean>(columnCount).fill(false);
  let numericSeen = 0;
  for (let c = 0; c < columnCount; c += 1) {
    const t = types[c] ?? 'unknown';
    columnTypes[c] = t;
    if (t === 'numeric') {
      if (numericSeen < MAX_CORRELATION_COLUMNS) inWindow[c] = true;
      numericSeen += 1;
    }
  }

  const accumulators: ColumnAccumulator[] = new Array<ColumnAccumulator>(columnCount);
  for (let c = 0; c < columnCount; c += 1) {
    accumulators[c] = newAccumulator(columnTypes[c], rowCount, inWindow[c]);
  }

  // Duplicate row detection (Requirement 3.6): the row's field values in header
  // order joined with \u0000, a delimiter no CSV field can contain. Later
  // occurrences are counted, so three identical rows contribute 2. `keyParts` is
  // reused across rows; every slot is overwritten each iteration.
  const seenRowKeys = new Set<string>();
  const keyParts: string[] = new Array<string>(columnCount).fill('');
  let duplicateRowCount = 0;

  for (let r = 0; r < rowCount; r += 1) {
    const row = rows[r];

    for (let c = 0; c < columnCount; c += 1) {
      const raw = row === undefined || row === null ? undefined : row[c];
      const cell = raw === undefined || raw === null ? '' : raw;
      keyParts[c] = cell;

      const acc = accumulators[c];
      if (isNullish(cell)) {
        acc.nullCount += 1;
        continue;
      }

      acc.nonNullCount += 1;
      acc.distinct.add(cell);

      switch (columnTypes[c]) {
        case 'numeric': {
          const n = parseFiniteNumber(cell);
          if (n === null) break;
          if (acc.aligned !== null) acc.aligned[r] = n;
          else if (acc.numericValues !== null) acc.numericValues.push(n);
          break;
        }
        case 'categorical': {
          if (acc.freq === null) break;
          acc.freq.set(cell, (acc.freq.get(cell) ?? 0) + 1);
          break;
        }
        case 'datetime': {
          const ms = parseAcceptedDate(cell);
          if (ms === null) {
            acc.unparsedDateCount += 1;
            break;
          }
          if (acc.minDateMs === null || ms < acc.minDateMs) acc.minDateMs = ms;
          if (acc.maxDateMs === null || ms > acc.maxDateMs) acc.maxDateMs = ms;
          break;
        }
        default:
          break;
      }
    }

    if (columnCount > 0) {
      const key = keyParts.join('\u0000');
      if (seenRowKeys.has(key)) duplicateRowCount += 1;
      else seenRowKeys.add(key);
    }
  }

  // Finalize per column, collecting correlation candidates as we go.
  const columns: ColumnProfile[] = new Array<ColumnProfile>(columnCount);
  const candidates: CorrelationCandidate[] = [];

  for (let c = 0; c < columnCount; c += 1) {
    const acc = accumulators[c];
    const name = headers[c];
    const type = columnTypes[c];

    // Requirement 3.13: an all-null column records the three counts, is marked
    // not computed, and carries no type-specific block.
    if (acc.nonNullCount === 0) {
      columns[c] = {
        name,
        type,
        nullCount: acc.nullCount,
        nonNullCount: 0,
        distinctCount: 0,
        statsComputed: false,
      };
      continue;
    }

    const profile: ColumnProfile = {
      name,
      type,
      nullCount: acc.nullCount,
      nonNullCount: acc.nonNullCount,
      distinctCount: acc.distinct.size,
      statsComputed: true,
    };

    if (type === 'numeric') {
      const numeric = finalizeNumeric(acc);
      if (numeric !== null) {
        profile.numeric = numeric;
        // Requirement 3.8: a zero-variance column is excluded from every pair.
        if (acc.aligned !== null && numeric.stdDev !== 0) {
          candidates.push({ name, values: acc.aligned });
        }
      }
    } else if (type === 'categorical') {
      const categorical = finalizeCategorical(acc);
      if (categorical !== null) profile.categorical = categorical;
    } else if (type === 'datetime') {
      const datetime = finalizeDatetime(acc);
      if (datetime !== null) profile.datetime = datetime;
    }

    columns[c] = profile;
  }

  return {
    sourceName: dataset.sourceName,
    retainedRowCount: rowCount,
    totalRowCount,
    duplicateRowCount,
    columns,
    correlations: computeCorrelations(candidates),
  };
}
