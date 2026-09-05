// lib/data-profiler/chart-recommender.ts
//
// Profile-driven chart recommendation. Pure module: total, deterministic, no
// ambient clock, no randomness, no input mutation. Every sort runs on a copy.
//
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 4.10, 4.11

import {
  MAX_CHART_SPECS,
  MAX_HISTOGRAM_BINS,
  MAX_TOP_VALUES,
  SCATTER_CORRELATION_THRESHOLD,
  SCATTER_MAX_POINTS,
} from './constants';
import type { ProfileCore } from './profiler';
import type { ChartSpec, ColumnProfile, ColumnType, ParsedDataset } from './types';
import { isNullish, parseAcceptedDate, parseFiniteNumber } from './values';

/** The five values a `ColumnType` may take. Anything else counts as absent (Req 4.11). */
const KNOWN_COLUMN_TYPES: readonly ColumnType[] = [
  'numeric',
  'categorical',
  'datetime',
  'identifier',
  'unknown',
];

/** Longest permitted `reason` string (Requirement 4.7). */
const MAX_REASON_LENGTH = 200;

/**
 * A spec paired with the column position that orders it within its type group
 * (Requirement 4.1). Discarded before the specs are returned.
 */
interface Ranked {
  index: number;
  spec: ChartSpec;
}

// --- Reason text -------------------------------------------------------------

/**
 * Clamps a reason to 1–200 characters (Requirement 4.7).
 *
 * Column names are visitor-supplied and unbounded, so a reason naming two of
 * them can exceed the ceiling. Truncating defensively here is the only way to
 * keep the bound a guarantee rather than an expectation; the ellipsis keeps the
 * result exactly `MAX_REASON_LENGTH` characters so the truncation is visible.
 * An empty result would violate the lower bound, so it falls back to a literal.
 */
function clampReason(text: string): string {
  if (text.length === 0) return 'Recommended chart';
  if (text.length <= MAX_REASON_LENGTH) return text;
  return `${text.slice(0, MAX_REASON_LENGTH - 1)}\u2026`;
}

// --- Dataset access ----------------------------------------------------------

/**
 * Dataset column index for a profile column.
 *
 * The profile is built in header order, so the positional index is almost always
 * correct; the name lookup is the fallback for a profile and dataset that were
 * built from the same headers but handed over separately. `-1` means the column
 * has no backing values, and the caller emits nothing for it.
 */
function resolveDatasetIndex(
  headers: readonly string[],
  profileIndex: number,
  name: string,
): number {
  if (headers[profileIndex] === name) return profileIndex;
  const byName = headers.indexOf(name);
  return byName;
}

/** Raw cell at `(row, column)`, tolerating ragged and absent rows. */
function cellAt(rows: readonly string[][], r: number, c: number): string | undefined {
  const row = rows[r];
  if (row === undefined || row === null) return undefined;
  return row[c];
}

// --- Histogram ---------------------------------------------------------------

/**
 * Position of `v` within `[min, max]` scaled to `[0, 1]`, computed without ever
 * forming `max - min`.
 *
 * `min * (1 - t) + max * t` is bounded by `max(|min|, |max|)` for `t` in
 * `[0, 1]`, so it is finite for every finite endpoint pair — unlike
 * `min + i * width`, which overflows to `Infinity` once `max - min` does.
 */
function lerp(min: number, max: number, t: number): number {
  return min * (1 - t) + max * t;
}

/**
 * One histogram per numeric column with at least 2 non-null values and at least
 * 2 distinct non-null values (Requirement 4.2).
 *
 * ```
 * binCount = min(MAX_HISTOGRAM_BINS, distinctNonNullCount)
 * width    = (max * scale - min * scale) / binCount
 * bin(v)   = v === max ? binCount - 1 : floor((v * scale - min * scale) / width)
 * lower_i  = lerp(min, max, i / binCount)
 * upper_i  = lerp(min, max, (i + 1) / binCount)
 * ```
 *
 * The `v === max` special case is load-bearing: without it the maximum lands in
 * bin index `binCount`, which does not exist, and the value is silently dropped.
 *
 * **Degenerate ranges.** Two float edge cases make the naive
 * `floor((v - min) / ((max - min) / binCount))` produce a non-finite index, and
 * a non-finite index is not merely ugly — `counts[NaN] += 1` writes a
 * string-keyed `"NaN"` property onto the array instead of incrementing a bin, so
 * the value is silently lost and the Requirement 4.10 invariant breaks:
 *
 * - **`width` underflows to 0.** `min = 0`, `max = 5e-324` (the smallest
 *   positive subnormal): `binCount` is 2 and `5e-324 / 2` rounds to exactly `0`,
 *   because a subnormal at the bottom of the exponent range cannot be halved.
 *   Then `floor((0 - 0) / 0)` is `floor(NaN)`. The same branch covers
 *   `max === min` — reachable because `distinctCount` counts distinct *strings*,
 *   so `"1"` and `"1.0"` read as 2 distinct values but one numeric position.
 * - **`max - min` overflows to `Infinity`.** `min ≈ -1e308`, `max ≈ 1e308`:
 *   `width` is `Infinity`, and for a value strictly inside the range `v - min`
 *   also overflows, so the index is `Infinity / Infinity === NaN`. Halving both
 *   endpoints first (`scale = 0.5`) keeps the subtraction finite and is exact for
 *   normal doubles, so this case yields a real distribution rather than a
 *   collapse. `scale` stays `1` whenever the span is finite, which is every
 *   ordinary column, so the common path is bit-identical to the plain formula.
 *
 * When `width` is still not positive after scaling (the collapse case above),
 * every value goes to bin 0: at the resolution the range affords there is one
 * occupied position, and reporting a single spike with the remaining bins empty
 * is more honest than spreading values across bins whose bounds are equal.
 *
 * Bin bounds use `lerp` rather than `min + i * width` so they are finite for
 * every finite endpoint pair. For a collapsed range every bound is `min`/`max`
 * (equal, or a hair apart) rather than `NaN`; for an overflowing span they are
 * real interior values. Bounds are never `NaN`, which the chart layer relies on.
 *
 * `unbinnableCount` is derived as `nonNullCount - parsedCount` rather than
 * counted independently, which makes the Requirement 4.10 invariant
 * `Σ bin.count + unbinnableCount === nonNullCount` hold by construction. See the
 * Requirement 4.10 interpretation note in design.md: bins are never padded and
 * no extra bucket is appended.
 */
function buildHistogram(
  column: ColumnProfile,
  index: number,
  rows: readonly string[][],
  datasetIndex: number,
): Ranked | null {
  if (column.nonNullCount < 2 || column.distinctCount < 2) return null;

  const values: number[] = [];
  for (let r = 0; r < rows.length; r += 1) {
    const cell = cellAt(rows, r, datasetIndex);
    if (isNullish(cell)) continue;
    const n = parseFiniteNumber(cell);
    if (n !== null) values.push(n);
  }

  // No numeric position at all: there is no min or max to bin against, so no
  // honest histogram exists for this column.
  if (values.length === 0) return null;

  const binCount = Math.min(MAX_HISTOGRAM_BINS, column.distinctCount);

  let min = values[0];
  let max = values[0];
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] < min) min = values[i];
    if (values[i] > max) max = values[i];
  }

  // Halve both endpoints only when the span would overflow, so ordinary columns
  // keep the exact arithmetic of the plain formula.
  const scale = Number.isFinite(max - min) ? 1 : 0.5;
  const width = (max * scale - min * scale) / binCount;
  // `!(width > 0)` is deliberately negated this way: it is true for 0, -0 and
  // NaN alike, so no non-positive or non-finite width reaches the division.
  const collapsed = !(width > 0);

  const counts = new Array<number>(binCount).fill(0);
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    let bin: number;
    if (collapsed) {
      bin = 0;
    } else {
      const raw = v === max ? binCount - 1 : Math.floor((v * scale - min * scale) / width);
      // The clamp is NaN-safe by construction: a non-finite index resolves to a
      // real bin instead of falling through both comparisons. `counts[NaN]` would
      // set a string key on the array rather than increment a bin, dropping the
      // value and breaking Requirement 4.10.
      if (!Number.isFinite(raw)) bin = raw > 0 ? binCount - 1 : 0;
      else if (raw < 0) bin = 0;
      else if (raw > binCount - 1) bin = binCount - 1;
      else bin = raw;
    }
    counts[bin] += 1;
  }

  const bins = counts.map((count, i) => ({
    lower: i === 0 ? min : lerp(min, max, i / binCount),
    upper: i === binCount - 1 ? max : lerp(min, max, (i + 1) / binCount),
    count,
  }));

  const unbinnable = column.nonNullCount - values.length;

  return {
    index,
    spec: {
      kind: 'histogram',
      column: column.name,
      columnType: column.type,
      binCount,
      bins,
      unbinnableCount: unbinnable > 0 ? unbinnable : 0,
      reason: clampReason(
        `Histogram of ${column.name} (${column.type}) across ${binCount} bins showing its value distribution.`,
      ),
    },
  };
}

// --- Bar ---------------------------------------------------------------------

/**
 * One bar chart per categorical column with at least 1 non-null value
 * (Requirement 4.3).
 *
 * The points are read straight off `ColumnProfile.categorical.topValues`, which
 * the profiler already produced as the `MAX_TOP_VALUES` most frequent values in
 * descending count with ties broken by ascending case-sensitive comparison
 * (Requirement 3.4) — the same ordering 4.3 demands. Recomputing frequencies
 * from the rows would duplicate that logic and risk the two drifting apart.
 * `slice` is a cap, not a fill, so a column with fewer than 10 distinct values
 * yields all of them.
 */
function buildBar(column: ColumnProfile, index: number): Ranked | null {
  if (column.nonNullCount < 1) return null;

  const topValues = column.categorical?.topValues;
  if (topValues === undefined || topValues.length === 0) return null;

  const points = topValues
    .slice(0, MAX_TOP_VALUES)
    .map((entry) => ({ label: entry.value, count: entry.count }));

  return {
    index,
    spec: {
      kind: 'bar',
      column: column.name,
      columnType: column.type,
      points,
      reason: clampReason(
        `Bar chart of the ${points.length} most frequent values in ${column.name} (${column.type}).`,
      ),
    },
  };
}

// --- Line --------------------------------------------------------------------

/**
 * Exactly one line chart, plotting the leftmost qualifying numeric column
 * against the leftmost qualifying datetime column, both needing at least 2
 * non-null values, with points in ascending datetime order (Requirement 4.4).
 *
 * Only rows where both cells are present and parseable contribute a point, so
 * the series carries no fabricated positions. Sorting by the parsed epoch value
 * rather than the ISO string keeps the ordering numeric; the two agree for
 * same-precision ISO strings, but not once precision varies.
 */
function buildLine(
  columns: readonly ColumnProfile[],
  headers: readonly string[],
  rows: readonly string[][],
): Ranked | null {
  let x = -1;
  let y = -1;
  for (let i = 0; i < columns.length; i += 1) {
    const column = columns[i];
    if (column.nonNullCount < 2) continue;
    if (x === -1 && column.type === 'datetime') x = i;
    if (y === -1 && column.type === 'numeric') y = i;
  }
  if (x === -1 || y === -1) return null;

  const xColumn = columns[x];
  const yColumn = columns[y];
  const xData = resolveDatasetIndex(headers, x, xColumn.name);
  const yData = resolveDatasetIndex(headers, y, yColumn.name);
  if (xData === -1 || yData === -1) return null;

  const collected: Array<{ ms: number; y: number }> = [];
  for (let r = 0; r < rows.length; r += 1) {
    const ms = parseAcceptedDate(cellAt(rows, r, xData));
    if (ms === null) continue;
    const value = parseFiniteNumber(cellAt(rows, r, yData));
    if (value === null) continue;
    collected.push({ ms, y: value });
  }
  collected.sort((a, b) => a.ms - b.ms);

  const points = collected.map((p) => ({
    x: new Date(p.ms).toISOString(),
    y: p.y,
  }));

  return {
    index: x,
    spec: {
      kind: 'line',
      xColumn: xColumn.name,
      yColumn: yColumn.name,
      xType: xColumn.type,
      yType: yColumn.type,
      points,
      reason: clampReason(
        `Line chart of ${yColumn.name} (${yColumn.type}) over ${xColumn.name} (${xColumn.type}) in ascending date order.`,
      ),
    },
  };
}

// --- Scatter -----------------------------------------------------------------

/**
 * Thins `points` to at most `cap` entries with a fixed stride
 * (design.md, "Performance Approach" → Rendering).
 *
 * ```
 * stride = ceil(total / cap)
 * kept   = indices 0, stride, 2*stride, … (count = ceil(total / stride) <= cap)
 * ```
 *
 * The stride is a pure function of `total` and `cap`, so the same input yields
 * the same points on every call — no `Math.random()`, in keeping with the
 * determinism Requirement 3.12 asks of the pipeline.
 *
 * Index 0 is always kept, and the final index is forced in because the extremes
 * are the visually informative ends of a scatter. When the stride already
 * produced exactly `cap` entries there is no room to append, so the last kept
 * entry is replaced rather than added — that keeps the cap a hard bound instead
 * of a `cap + 1` bound. Callers must report the true total separately; this
 * function does not describe what it dropped.
 */
function downsampleByStride<T>(points: readonly T[], cap: number): T[] {
  const total = points.length;
  if (cap < 1 || total <= cap) return points.slice();

  const stride = Math.ceil(total / cap);
  const kept: T[] = [];
  let lastKeptIndex = -1;
  for (let i = 0; i < total; i += stride) {
    kept.push(points[i]);
    lastKeptIndex = i;
  }

  if (lastKeptIndex !== total - 1) {
    if (kept.length < cap) kept.push(points[total - 1]);
    else kept[kept.length - 1] = points[total - 1];
  }
  return kept;
}

/**
 * Exactly one scatter chart, for the correlation pair with the largest absolute
 * coefficient at or above `SCATTER_CORRELATION_THRESHOLD` (Requirement 4.5).
 *
 * Ties are broken by the lowest column position of the pair's leftmost column,
 * then by the other column's position, then by name — enough to make the choice
 * total and deterministic even for a profile carrying duplicate pairs. The
 * profiler emits pairs with `columnA` ahead of `columnB` in header order, so
 * `columnA` becomes the x axis.
 *
 * Points are the pairwise-complete rows: both cells present and parsing as
 * finite numbers. Past `SCATTER_MAX_POINTS` they are thinned by
 * `downsampleByStride`; `totalPointCount` always reports the pre-downsample
 * total, and `coefficient` is copied from the profile rather than recomputed
 * from the retained subset, so the recorded statistics are unaffected.
 */
function buildScatter(
  profile: ProfileCore,
  columns: readonly ColumnProfile[],
  headers: readonly string[],
  rows: readonly string[][],
): Ranked | null {
  const correlations = profile.correlations ?? [];
  if (correlations.length === 0) return null;

  const positionOf = new Map<string, number>();
  for (let i = 0; i < columns.length; i += 1) {
    if (!positionOf.has(columns[i].name)) positionOf.set(columns[i].name, i);
  }

  let best: { a: number; b: number; magnitude: number; pair: (typeof correlations)[number] } | null =
    null;

  for (const pair of correlations) {
    const magnitude = Math.abs(pair.coefficient);
    if (!Number.isFinite(magnitude) || magnitude < SCATTER_CORRELATION_THRESHOLD) continue;

    const posA = positionOf.get(pair.columnA);
    const posB = positionOf.get(pair.columnB);
    if (posA === undefined || posB === undefined) continue;

    const a = Math.min(posA, posB);
    const b = Math.max(posA, posB);

    if (best === null) {
      best = { a, b, magnitude, pair };
      continue;
    }
    if (magnitude > best.magnitude) {
      best = { a, b, magnitude, pair };
      continue;
    }
    if (magnitude < best.magnitude) continue;
    if (a < best.a || (a === best.a && b < best.b)) best = { a, b, magnitude, pair };
  }

  if (best === null) return null;

  const xColumn = columns[best.a];
  const yColumn = columns[best.b];
  const xData = resolveDatasetIndex(headers, best.a, xColumn.name);
  const yData = resolveDatasetIndex(headers, best.b, yColumn.name);
  if (xData === -1 || yData === -1) return null;

  const collected: Array<{ x: number; y: number }> = [];
  for (let r = 0; r < rows.length; r += 1) {
    const xv = parseFiniteNumber(cellAt(rows, r, xData));
    if (xv === null) continue;
    const yv = parseFiniteNumber(cellAt(rows, r, yData));
    if (yv === null) continue;
    collected.push({ x: xv, y: yv });
  }

  const totalPointCount = collected.length;
  const points = downsampleByStride(collected, SCATTER_MAX_POINTS);
  const downsampled = points.length < totalPointCount;

  return {
    index: best.a,
    spec: {
      kind: 'scatter',
      xColumn: xColumn.name,
      yColumn: yColumn.name,
      xType: xColumn.type,
      yType: yColumn.type,
      coefficient: best.pair.coefficient,
      points,
      totalPointCount,
      reason: clampReason(
        `Scatter chart of ${xColumn.name} (${xColumn.type}) against ${yColumn.name} (${yColumn.type}), correlation ${best.pair.coefficient}.` +
          (downsampled ? ` Showing ${points.length} of ${totalPointCount} points.` : ''),
      ),
    },
  };
}

// --- Entry point -------------------------------------------------------------

function byColumnIndex(a: Ranked, b: Ranked): number {
  return a.index - b.index;
}

/**
 * Derives the recommended charts from a profile and the dataset it was built
 * from, with no input from the visitor (Requirement 4.1).
 *
 * **Why the dataset is a parameter.** design.md's module table writes this as
 * `recommendCharts(profile)`, but a `ProfileCore` carries aggregates only.
 * Histogram bins, line series and scatter series are all row-level: they need
 * the actual values, which no aggregate can reconstruct. Bar points are the one
 * exception — `ColumnProfile.categorical.topValues` already holds exactly what
 * Requirement 4.3 asks for. The alternatives were to have the profiler retain
 * every parsed value on the profile (bloating the profile, the insight payload
 * and the JSON export with row data, which Requirement 6.3 forbids carrying to
 * the server) or to re-parse inside the UI (moving specified logic out of the
 * pure module). Widening the signature is the narrower deviation, and the
 * function stays pure.
 *
 * Ordering: each type's list is built independently and sorted by the
 * left-to-right column position of its source column, the lists are
 * concatenated as line, scatter, histogram, bar, and the result is truncated to
 * `MAX_CHART_SPECS`. Because line and scatter emit at most one spec each,
 * truncation only ever drops histograms and bars.
 *
 * Returns `[]` when no profile or dataset is available, when the profile has no
 * columns, or when every column is missing a `ColumnType` (Requirement 4.11).
 * Total: nothing here throws, and neither argument is mutated.
 */
export function recommendCharts(
  profile: ProfileCore | null | undefined,
  dataset: ParsedDataset | null | undefined,
): ChartSpec[] {
  if (profile === null || profile === undefined) return [];
  if (dataset === null || dataset === undefined) return [];

  const columns = profile.columns ?? [];
  if (columns.length === 0) return [];

  // Requirement 4.11: a profile carrying no usable type for any column cannot
  // support a recommendation. A column typed `unknown` *is* typed — it simply
  // qualifies for no chart — so it does not trip this guard.
  const hasAnyType = columns.some(
    (column) => column !== null && column !== undefined && KNOWN_COLUMN_TYPES.includes(column.type),
  );
  if (!hasAnyType) return [];

  const headers = dataset.headers ?? [];
  const rows = dataset.rows ?? [];

  const histograms: Ranked[] = [];
  const bars: Ranked[] = [];

  for (let i = 0; i < columns.length; i += 1) {
    const column = columns[i];
    if (column === null || column === undefined) continue;

    if (column.type === 'numeric') {
      const datasetIndex = resolveDatasetIndex(headers, i, column.name);
      if (datasetIndex === -1) continue;
      const ranked = buildHistogram(column, i, rows, datasetIndex);
      if (ranked !== null) histograms.push(ranked);
    } else if (column.type === 'categorical') {
      const ranked = buildBar(column, i);
      if (ranked !== null) bars.push(ranked);
    }
  }

  const lines: Ranked[] = [];
  const line = buildLine(columns, headers, rows);
  if (line !== null) lines.push(line);

  const scatters: Ranked[] = [];
  const scatter = buildScatter(profile, columns, headers, rows);
  if (scatter !== null) scatters.push(scatter);

  histograms.sort(byColumnIndex);
  bars.sort(byColumnIndex);

  return [...lines, ...scatters, ...histograms, ...bars]
    .map((ranked) => ranked.spec)
    .slice(0, MAX_CHART_SPECS);
}
