import type { QualityFactor } from './types';

// --- Intake caps and timeouts -------------------------------------------------

/** Maximum data rows retained in memory. Rows past this are counted, not kept. */
export const ROW_CAP = 50_000;

/** Hard upload size cap, checked before any read is issued. */
export const SIZE_CAP_BYTES = 5 * 1024 * 1024;

/** File read watchdog. Exceeding this aborts the parse. */
export const READ_TIMEOUT_MS = 60_000;

/** Insight request watchdog. */
export const INSIGHT_TIMEOUT_MS = 30_000;

// --- Analysis caps -----------------------------------------------------------

export const MAX_PROFILE_COLUMNS = 200;
export const MAX_INFER_ROWS = 100_000;
export const MAX_INFER_COLUMNS = 100;
export const MAX_CORRELATION_COLUMNS = 30;
export const MAX_TOP_VALUES = 10;
export const MAX_HISTOGRAM_BINS = 30;

// --- Presentation caps -------------------------------------------------------

export const MAX_CHART_SPECS = 12;
export const MAX_RENDERED_RECOMMENDATIONS = 100;
export const CHART_TEXT_ALT_VALUE_LIMIT = 30;

// --- Type inference thresholds -----------------------------------------------

/**
 * Thresholds for the fixed type-inference precedence. Every value is a ratio of
 * (or a count against) the column's non-null count.
 */
export const TYPE_THRESHOLDS = {
  /** Minimum share of non-null values parsing as finite numbers for `numeric`. */
  numericParseRate: 0.95,
  /** Minimum share of non-null values parsing as accepted dates for `datetime`. */
  dateParseRate: 0.95,
  /** Minimum non-null count before a fully distinct column counts as `identifier`. */
  identifierMinNonNull: 20,
  /** Maximum distinct-to-non-null ratio for `categorical`. */
  categoricalDistinctRatio: 0.5,
} as const;

// --- Analysis thresholds -----------------------------------------------------

/** Tukey fence multiplier: bounds are q1 - 1.5*iqr and q3 + 1.5*iqr. */
export const IQR_MULTIPLIER = 1.5;

/** Minimum |r| for a numeric pair to earn a scatter recommendation. */
export const SCATTER_CORRELATION_THRESHOLD = 0.5;

/**
 * Maximum plotted points a scatter Chart_Spec may carry. Past this the points
 * are thinned with a deterministic fixed stride so the SVG node count stays
 * bounded; the recorded coefficient and the reported total are unaffected.
 */
export const SCATTER_MAX_POINTS = 5_000;

// --- Quality scoring ---------------------------------------------------------

/** Four-factor penalty weights. Sums to exactly 100. */
export const QUALITY_WEIGHTS: Record<QualityFactor, number> = {
  nulls: 40,
  duplicates: 25,
  outliers: 20,
  unknownTypes: 15,
};

// --- Dataset question answering ----------------------------------------------
//
// The profiler's Q&A retrieves from an index built out of the profile itself.
// These bound both ends of that: how much text one fact may carry, and how much
// of it a single question is allowed to ship.

/** Longest rendered `DatasetFact.text`. Kept under the wire schema's 300 cap. */
export const FACT_TEXT_CAP = 300;

/**
 * Ceiling on the index. `MAX_PROFILE_COLUMNS` columns emit at most two facts
 * each, plus correlations, recommendations, charts and two dataset-level facts,
 * which lands near 570 in the worst case.
 */
export const MAX_FACTS = 600;

/**
 * Facts sent with one question. The point of retrieving at all is that this
 * number stays small while `MAX_FACTS` does not.
 */
export const MAX_RETRIEVED_FACTS = 12;

/** Second ceiling on the same payload, in characters, whichever binds first. */
export const MAX_FACT_CONTEXT_CHARS = 6_000;

export const QUESTION_MIN_LENGTH = 3;
export const QUESTION_MAX_LENGTH = 300;

/** Matches `INSIGHT_TIMEOUT_MS`: the same model behind the same edge runtime. */
export const QA_TIMEOUT_MS = 30_000;
