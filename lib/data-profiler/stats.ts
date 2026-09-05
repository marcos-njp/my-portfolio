// lib/data-profiler/stats.ts
//
// Numeric summary primitives. Pure module: no side effects, no ambient clock,
// no randomness, no input mutation. Nothing here sorts in place — the
// `quantile` precondition puts sorting on the caller.
//
// Requirements: 3.3, 3.7, 3.11

import { IQR_MULTIPLIER } from './constants';

/**
 * Rounds to six decimal places: `Math.round(x * 1e6) / 1e6`.
 *
 * Applied to every recorded statistic (Requirement 3.3). Monotonic
 * non-decreasing, which is why applying it *after* the quartile computation
 * cannot invert the `min <= q1 <= median <= q3 <= max` ordering.
 *
 * Non-finite input is returned unchanged — `NaN * 1e6` is `NaN` and
 * `Infinity * 1e6` is `Infinity`, so the arithmetic would be a no-op anyway,
 * but the guard makes the intent explicit and keeps the function total.
 */
export function round6(x: number): number {
  if (!Number.isFinite(x)) return x;
  return Math.round(x * 1e6) / 1e6;
}

/**
 * Quantile at `p` by R-7 linear interpolation (the `numpy.percentile` default).
 *
 * **Precondition: `xs` must already be sorted ascending and non-empty.** This
 * function does not sort, copy, or validate ordering — sorting is the caller's
 * responsibility, which keeps it O(1) per call when several quantiles are read
 * off one sorted array. `xs` is never mutated.
 *
 * ```
 * h  = (n - 1) * p
 * lo = floor(h); hi = ceil(h)
 * q  = xs[lo] + (h - lo) * (xs[hi] - xs[lo])
 * ```
 *
 * `p = 0` gives the min, `p = 1` gives the max, and `n = 1` gives that single
 * value for every `p`. Monotonic in `p` because it interpolates between
 * adjacent ranks of a sorted array — that is what makes
 * `min <= q1 <= median <= q3 <= max` (Requirement 3.10) hold by construction
 * rather than by clamping.
 *
 * Total for defence in depth: an empty `xs` yields `NaN`, and `p` outside
 * `[0, 1]` is clamped into range rather than reading past the array.
 */
export function quantile(xs: readonly number[], p: number): number {
  const n = xs.length;
  if (n === 0) return NaN;
  if (n === 1) return xs[0];

  const clampedP = p < 0 ? 0 : p > 1 ? 1 : p;
  const h = (n - 1) * clampedP;
  const lo = Math.floor(h);
  const hi = Math.ceil(h);
  if (lo === hi) return xs[lo];

  return xs[lo] + (h - lo) * (xs[hi] - xs[lo]);
}

/**
 * Arithmetic mean via Welford's online algorithm — a single numerically stable
 * pass, no large intermediate sum to lose precision to.
 *
 * Returns `NaN` for an empty input; `n = 1` returns that value exactly.
 */
export function mean(xs: readonly number[]): number {
  const n = xs.length;
  if (n === 0) return NaN;
  if (n === 1) return xs[0];

  let m = 0;
  for (let i = 0; i < n; i += 1) {
    m += (xs[i] - m) / (i + 1);
  }
  return m;
}

/**
 * Standard deviation via Welford's online algorithm, single pass.
 *
 * **Population** standard deviation — the sum of squared deviations is divided
 * by `n`, not `n - 1`. The design does not specify which; population is the
 * right choice here because these are complete-population descriptive
 * statistics over the column's retained values, not inferential estimates of a
 * wider population's spread.
 *
 * Returns `NaN` for an empty input and exactly `0` for a single value (a
 * one-element population has no spread).
 */
export function stdDev(xs: readonly number[]): number {
  const n = xs.length;
  if (n === 0) return NaN;
  if (n === 1) return 0;

  let m = 0;
  let m2 = 0; // running sum of squared deviations from the current mean
  for (let i = 0; i < n; i += 1) {
    const delta = xs[i] - m;
    m += delta / (i + 1);
    m2 += delta * (xs[i] - m);
  }

  const variance = m2 / n;
  // m2 is non-negative by construction; guard against a tiny negative from
  // rounding so sqrt never yields NaN.
  return variance <= 0 ? 0 : Math.sqrt(variance);
}

/**
 * Pearson correlation coefficient over paired values, clamped to `[-1, 1]`.
 *
 * ```
 * r = Σ(xi - x̄)(yi - ȳ) / sqrt( Σ(xi - x̄)² · Σ(yi - ȳ)² )
 * ```
 *
 * Two-pass — means first, then deviations — rather than the algebraically
 * equivalent raw-moment `Σxy` form, which catastrophically cancels when values
 * are large relative to their spread.
 *
 * **Precondition: `xs` and `ys` are equal-length, pairwise-complete arrays.**
 * Pairing and null filtering belong to the caller. Neither array is mutated.
 *
 * Returns `null` rather than `NaN` when the coefficient is undefined:
 * mismatched lengths, a paired length below 3, or a zero-variance input on
 * either side (a zero denominator — Requirement 3.8).
 *
 * The clamp is applied *before* rounding so floating-point overshoot is
 * absorbed, giving `|r| <= 1` (Requirement 3.11) unconditionally.
 */
export function pearson(xs: readonly number[], ys: readonly number[]): number | null {
  const n = xs.length;
  if (n !== ys.length) return null;
  if (n < 3) return null;

  const xBar = mean(xs);
  const yBar = mean(ys);
  if (!Number.isFinite(xBar) || !Number.isFinite(yBar)) return null;

  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - xBar;
    const dy = ys[i] - yBar;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }

  // Either side constant => zero denominator => coefficient undefined.
  if (sxx <= 0 || syy <= 0) return null;

  const denominator = Math.sqrt(sxx * syy);
  if (!Number.isFinite(denominator) || denominator === 0) return null;

  const r = sxy / denominator;
  if (!Number.isFinite(r)) return null;

  const clamped = r < -1 ? -1 : r > 1 ? 1 : r;
  return round6(clamped);
}

/** Tukey fences for a column, derived from its quartiles. */
export interface OutlierBounds {
  iqr: number;
  lowerBound: number;
  upperBound: number;
}

/**
 * Tukey fences: `q1 - 1.5 * iqr` and `q3 + 1.5 * iqr`, using `IQR_MULTIPLIER`.
 *
 * Shared by the profiler and the quality scorer so both flag the same values.
 * When `iqr === 0` the bounds collapse onto `q1`/`q3`, so only values outside
 * that constant are flagged — the correct reading for a near-constant column.
 */
export function outlierBounds(q1: number, q3: number): OutlierBounds {
  const iqr = q3 - q1;
  return {
    iqr,
    lowerBound: q1 - IQR_MULTIPLIER * iqr,
    upperBound: q3 + IQR_MULTIPLIER * iqr,
  };
}

/**
 * True when `v` falls strictly outside the fences. A value sitting exactly on
 * a bound is **not** an outlier.
 */
export function isOutlier(v: number, bounds: OutlierBounds): boolean {
  return v < bounds.lowerBound || v > bounds.upperBound;
}

/**
 * Counts values strictly outside the fences.
 *
 * Order-independent and non-mutating, so it accepts either a sorted or an
 * unsorted array.
 */
export function countOutliers(xs: readonly number[], bounds: OutlierBounds): number {
  let count = 0;
  for (let i = 0; i < xs.length; i += 1) {
    if (isOutlier(xs[i], bounds)) count += 1;
  }
  return count;
}
