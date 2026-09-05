// lib/data-profiler/quality-scorer.ts
//
// Four-factor data quality scoring and cleaning recommendations. Pure module:
// total, deterministic, no ambient clock, no randomness, no input mutation.
//
// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.8, 5.9 (plus the 5.7 ordering,
// emitted here so the display layer can render the list as given).

import { QUALITY_WEIGHTS } from './constants';
import type { ProfileCore } from './profiler';
import type {
  CleaningRecommendation,
  ColumnProfile,
  QualityFactor,
  QualityPenalty,
  QualityResult,
} from './types';

/**
 * The fixed penalty order required by `QualityResult.penalties` — nulls,
 * duplicates, outliers, unknownTypes. Also the source of the stable tie-break
 * for the Requirement 5.7 recommendation ordering.
 */
const FACTOR_ORDER: readonly QualityFactor[] = [
  'nulls',
  'duplicates',
  'outliers',
  'unknownTypes',
];

/**
 * Upper bound on a rendered `detail` or `action` string. Requirement 6.2 caps
 * these at 240 characters inside the insight payload, so they are kept within
 * that budget at the source rather than silently truncated downstream. Only the
 * column name is variable-length, so only the column name is shortened.
 */
const MAX_TEXT_LENGTH = 240;

/** Room left for the fixed prose around a column name in the longest template. */
const MAX_COLUMN_NAME_LENGTH = 80;

/**
 * A column name rendered for display: empty names become a positional
 * placeholder (a CSV header should never be empty, but Requirement 1.15 is
 * enforced by the parser, not here, and this module must stay total), and long
 * names are truncated so the surrounding prose cannot be pushed past
 * `MAX_TEXT_LENGTH`.
 */
function displayName(name: string | null | undefined, index: number): string {
  const raw = typeof name === 'string' ? name : '';
  if (raw === '') return `column ${index + 1}`;
  if (raw.length <= MAX_COLUMN_NAME_LENGTH) return raw;
  return `${raw.slice(0, MAX_COLUMN_NAME_LENGTH - 1)}\u2026`;
}

/** Final defence for the Requirement 6.2 length budget. */
function capText(s: string): string {
  return s.length <= MAX_TEXT_LENGTH ? s : `${s.slice(0, MAX_TEXT_LENGTH - 1)}\u2026`;
}

/** A non-negative integer count, or 0 for anything else. Keeps ratios total. */
function safeCount(n: unknown): number {
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) return 0;
  return n;
}

/**
 * A ratio, defined as 0 when the denominator is 0 (design.md: "each defined as
 * 0 when its denominator is 0") and clamped into `[0, 1]`.
 *
 * The clamp is not cosmetic. Requirement 5.8 must hold for *any* structurally
 * valid profile, including internally inconsistent ones — an outlier count
 * larger than the numeric non-null count, say — and without the clamp such a
 * profile would produce `penalty > weight` and push the score below 0.
 */
function ratio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  const r = numerator / denominator;
  if (!Number.isFinite(r) || r <= 0) return 0;
  return r > 1 ? 1 : r;
}

/**
 * `clamp(Math.round(weight * ratio), 0, weight)`.
 *
 * With `ratio ∈ [0,1]` the clamp is already implied, but it is applied anyway so
 * the integer range `[0, weight]` is a property of this function rather than a
 * consequence of a caller invariant.
 */
function toPenalty(factor: QualityFactor, r: number): QualityPenalty {
  const weight = QUALITY_WEIGHTS[factor];
  const raw = Math.round(weight * r);
  const penalty = raw < 0 ? 0 : raw > weight ? weight : raw;
  return { factor, weight, ratio: r, penalty };
}

/** A percentage of `total` rounded to 1 decimal place; 0 when `total` is 0. */
function percentOf(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

/**
 * Numeric statistics are only trustworthy when the profiler actually computed
 * them: Requirement 3.13 omits the block for an all-null column and marks it
 * `statsComputed: false`, and `finalizeNumeric` omits it when nothing parsed.
 * Either way there are no IQR bounds to name, so Requirement 5.5 cannot be
 * satisfied for that column and no recommendation is emitted for it.
 */
function numericStatsOf(column: ColumnProfile) {
  if (column.statsComputed !== true) return null;
  return column.numeric ?? null;
}

/** Trims a bound to a readable length without changing its value's meaning. */
function formatBound(x: number): string {
  if (!Number.isFinite(x)) return 'n/a';
  return String(Math.round(x * 1e6) / 1e6);
}

// --- Ratios ------------------------------------------------------------------

function computePenalties(profile: ProfileCore): QualityPenalty[] {
  const columns = profile.columns ?? [];
  const columnCount = columns.length;
  const retainedRowCount = safeCount(profile.retainedRowCount);

  let totalNulls = 0;
  let unknownColumns = 0;
  let numericOutliers = 0;
  let numericNonNull = 0;

  for (let i = 0; i < columnCount; i += 1) {
    const column = columns[i];
    if (column === undefined || column === null) continue;

    totalNulls += safeCount(column.nullCount);
    if (column.type === 'unknown') unknownColumns += 1;

    if (column.type === 'numeric') {
      numericNonNull += safeCount(column.nonNullCount);
      const numeric = numericStatsOf(column);
      if (numeric !== null) numericOutliers += safeCount(numeric.outlierCount);
    }
  }

  return [
    toPenalty('nulls', ratio(totalNulls, retainedRowCount * columnCount)),
    toPenalty('duplicates', ratio(safeCount(profile.duplicateRowCount), retainedRowCount)),
    toPenalty('outliers', ratio(numericOutliers, numericNonNull)),
    toPenalty('unknownTypes', ratio(unknownColumns, columnCount)),
  ];
}

// --- Recommendations ---------------------------------------------------------

/**
 * Recommendations grouped by factor, each group already in column order.
 *
 * Requirement 5.7 orders the displayed list by descending penalty contribution
 * of the factor that produced each recommendation. That is a display concern,
 * but the ordering is pure arithmetic over the penalties, so it is applied here:
 * the component renders `recommendations` as given (and Requirement 5.12's
 * first-100 slice is then a plain `slice`), and the ordering stays unit-testable
 * in this module.
 */
function collectRecommendations(
  profile: ProfileCore,
  penalties: readonly QualityPenalty[],
): CleaningRecommendation[] {
  const columns = profile.columns ?? [];
  const retainedRowCount = safeCount(profile.retainedRowCount);
  const duplicateRowCount = safeCount(profile.duplicateRowCount);

  const byFactor: Record<QualityFactor, CleaningRecommendation[]> = {
    nulls: [],
    duplicates: [],
    outliers: [],
    unknownTypes: [],
  };

  // Requirement 5.4: one dataset-level entry, not attributed to a column.
  if (duplicateRowCount > 0) {
    byFactor.duplicates.push({
      column: null,
      issue: 'duplicates',
      factor: 'duplicates',
      detail: capText(
        `${duplicateRowCount} duplicate row${duplicateRowCount === 1 ? '' : 's'} ` +
          `(${percentOf(duplicateRowCount, retainedRowCount).toFixed(1)}% of ` +
          `${retainedRowCount} retained rows) repeat an earlier row exactly.`,
      ),
      action: capText(
        'Deduplicate: drop the repeated rows, keeping the first occurrence of each, ' +
          'or confirm the repetition is genuine before aggregating.',
      ),
    });
  }

  for (let i = 0; i < columns.length; i += 1) {
    const column = columns[i];
    if (column === undefined || column === null) continue;
    const name = displayName(column.name, i);

    // Requirement 5.3
    const nullCount = safeCount(column.nullCount);
    if (nullCount > 0) {
      byFactor.nulls.push({
        column: column.name,
        issue: 'nulls',
        factor: 'nulls',
        detail: capText(
          `${name} has ${nullCount} missing value${nullCount === 1 ? '' : 's'} ` +
            `(${percentOf(nullCount, retainedRowCount).toFixed(1)}% of ${retainedRowCount} rows).`,
        ),
        action: capText(
          'Handle the missing values: impute them, drop the affected rows, or drop the ' +
            'column if too little data remains to be useful.',
        ),
      });
    }

    // Requirement 5.5
    if (column.type === 'numeric') {
      const numeric = numericStatsOf(column);
      const outlierCount = numeric === null ? 0 : safeCount(numeric.outlierCount);
      if (numeric !== null && outlierCount > 0) {
        byFactor.outliers.push({
          column: column.name,
          issue: 'outliers',
          factor: 'outliers',
          detail: capText(
            `${name} has ${outlierCount} outlier${outlierCount === 1 ? '' : 's'} ` +
              `outside the interquartile range bounds ` +
              `[${formatBound(numeric.lowerBound)}, ${formatBound(numeric.upperBound)}] ` +
              `(Q1 ${formatBound(numeric.q1)}, Q3 ${formatBound(numeric.q3)}).`,
          ),
          action: capText(
            'Review the flagged values: correct entry errors, cap or transform genuine ' +
              'extremes, or keep them and prefer median-based summaries.',
          ),
        });
      }
    }

    // Requirement 5.6
    if (column.type === 'unknown') {
      byFactor.unknownTypes.push({
        column: column.name,
        issue: 'unknownType',
        factor: 'unknownTypes',
        detail: capText(
          `${name} could not be classified as numeric, datetime, identifier or categorical.`,
        ),
        action: capText(
          'Review this column manually: check for mixed formats, stray separators or an ' +
            'all-empty column, then normalize the values or exclude the column.',
        ),
      });
    }
  }

  // Requirement 5.7: descending penalty, ties resolved by the fixed factor
  // order so the result is deterministic. Within a factor, column order is
  // preserved because each group was built in a single left-to-right pass.
  const orderedFactors = FACTOR_ORDER.slice().sort((a, b) => {
    const pa = penalties.find((p) => p.factor === a)?.penalty ?? 0;
    const pb = penalties.find((p) => p.factor === b)?.penalty ?? 0;
    if (pb !== pa) return pb - pa;
    return FACTOR_ORDER.indexOf(a) - FACTOR_ORDER.indexOf(b);
  });

  const out: CleaningRecommendation[] = [];
  for (const factor of orderedFactors) out.push(...byFactor[factor]);
  return out;
}

// --- Entry point -------------------------------------------------------------

/**
 * Computes the quality score, the four per-factor penalty contributions, and the
 * cleaning recommendations for a profile.
 *
 * Accepts `ProfileCore` (a `DataProfile` without `quality`) so the caller can
 * compose `attachQuality(core, scoreQuality(core))` without the profiler having
 * to depend on this module. A full `DataProfile` satisfies `ProfileCore`
 * structurally, so either input works.
 *
 * `score` is *defined* as `100 - Σpenalty`, never derived any other way, which
 * makes Requirement 5.2 (`Σpenalty === 100 - score`) an identity that rounding
 * cannot break. Each penalty is an integer in `[0, weight]` and the weights sum
 * to exactly 100, so `score` is an integer in `[0, 100]` (Requirement 5.8). A
 * clean profile drives all four ratios to 0, so every penalty is 0 and the score
 * is exactly 100 (Requirement 5.9).
 *
 * Pure: no clock, no randomness, and `profile` is not mutated.
 */
export function scoreQuality(profile: ProfileCore): QualityResult {
  const penalties = computePenalties(profile);
  const totalPenalty = penalties.reduce((sum, p) => sum + p.penalty, 0);

  return {
    score: 100 - totalPenalty,
    penalties,
    recommendations: collectRecommendations(profile, penalties),
  };
}
