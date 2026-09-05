// lib/data-profiler/insight-payload.ts
//
// Builds the one request body this feature ever sends to a server:
// the Insight_Payload for `POST /api/profile-insights`.
//
// Pure module: total (never throws), deterministic, no clock, no randomness, no
// mutation of the input profile. Every value it emits is copied, truncated or
// clamped into a fresh object.
//
// _Requirements: 6.1, 6.2, 6.3, 6.4_
//
// --- Signature note (read before task 12.1 / 13.7 wires this up) -------------
//
// design.md and tasks.md write this as `buildInsightPayload(profile, quality)`.
// It is implemented here as `buildInsightPayload(profile)` — one argument.
//
// The reason: `DataProfile` already *embeds* `quality: QualityResult` (see
// `types.ts`), because the pipeline is
// `attachQuality(profileDataset(...), scoreQuality(core))`. A second `quality`
// parameter would therefore be redundant, and worse than redundant: it would
// make it possible to build a payload whose `qualityScore` and
// `cleaningRecommendations` came from a *different* profile than its columns —
// a silent inconsistency the type system could not catch. Taking the profile
// alone makes that unrepresentable.
//
// Callers that only hold a `ProfileCore` (no quality yet) must call
// `attachQuality` first; that is the same order the state machine already
// follows.
//
// --- CRITICAL: `sourceName` is deliberately EXCLUDED -------------------------
//
// Do not "fix" this by adding it. design.md is explicit:
//
//   "`sourceName` is deliberately **excluded** — a visitor's file name is
//    visitor-influenced input, and 6.2 does not list it. The export
//    (Requirement 7.3) still includes it, since that never leaves the browser."
//
// A file name is a string the visitor chose. It reaches the prompt as text if it
// is included, which is exactly the class of input Requirement 6.4 removes.
// Requirement 6.2 is an exhaustive allow-list ("only the following fields and no
// others") and `sourceName` is not on it, so including it would also fail
// `insightPayloadSchema.strict()` at the boundary as an unrecognized key — the
// request would 400 rather than silently leak, but it would still be a bug.
// `report-exporter.ts` includes `sourceName` and that is correct there: the
// export is a Blob download, it never crosses the network (Requirement 7.5).
//
// --- Requirement 6.3: no data row value, with the stated exceptions ----------
//
// Nothing here reads `dataset.rows`; it cannot, it never sees a `ParsedDataset`.
// The only cell-derived strings reachable from a `DataProfile` are the
// aggregates Requirement 6.3 explicitly permits — `CategoricalStats.topValues[]
// .value` (most-frequent) and `DatetimeStats.earliest`/`latest` (min/max) — and
// each is truncated to 64 characters here. `NumericStats.min`/`max` are the
// numeric minimum and maximum: they are `number`s, so there is no string to
// truncate and no free text to smuggle. Column *names* come from the header row,
// not from a data row, and are capped at 128 characters by Requirement 6.2.
//
// `NumericStats.lowerBound`/`upperBound` are dropped: the numeric block in the
// schema has exactly eight fields and those two are not among them. They exist
// for Requirement 5.5's on-screen text, and the recommendation `detail` that
// names them is already carried in `cleaningRecommendations`.
//
// --- Requirement 6.4: nothing from keyboard or clipboard ---------------------
//
// The payload is built *only* from a `DataProfile`, and a `DataProfile` is
// derived by `profileDataset` + `scoreQuality` from parsed CSV structure. There
// is no parameter through which visitor-authored text could enter this function,
// so the guarantee is structural rather than filtered: there is nothing to
// filter. The insight control itself exposes no text field (task 13.7), which is
// the other half of 6.4.

import { MAX_PROFILE_COLUMNS, MAX_TOP_VALUES } from './constants';
import type { InsightPayload } from './insight-schema';
import type {
  CleaningRecommendation,
  ColumnProfile,
  ColumnType,
  CorrelationPair,
  DataProfile,
} from './types';

// --- Caps --------------------------------------------------------------------
//
// Exported so the tests assert against the same numbers the builder uses, and so
// a future reader can see at a glance that they mirror `insight-schema.ts`
// exactly. If one of these ever disagrees with the schema, the payload stops
// being valid-by-construction and the route starts answering 400 to its own
// client — so they are asserted equal in the unit tests.

/** Requirement 6.2: column names truncated to 128 characters. */
export const MAX_COLUMN_NAME_CHARS = 128;

/** Requirement 6.3: aggregate extrema and most-frequent values, 64 characters. */
export const MAX_AGGREGATE_VALUE_CHARS = 64;

/** Recommendation `detail` / `action` budget, matching the schema. */
export const MAX_RECOMMENDATION_TEXT_CHARS = 240;

/** Requirement 6.2: at most 50 Correlation_Pair records. */
export const MAX_INSIGHT_CORRELATIONS = 50;

/** Requirement 6.2: at most 50 Cleaning_Recommendation records. */
export const MAX_INSIGHT_RECOMMENDATIONS = 50;

const COLUMN_TYPES: readonly ColumnType[] = [
  'numeric',
  'categorical',
  'datetime',
  'identifier',
  'unknown',
];

// --- Coercions ---------------------------------------------------------------
//
// These exist so `buildInsightPayload` is total *and* its result passes
// `insightPayloadSchema.strict()` for any structurally typed input, including
// one that is internally inconsistent. A hand-built or future-refactored profile
// carrying `NaN`, `Infinity` or a fractional count would otherwise produce a
// body that our own route rejects — a failure that surfaces to a visitor as an
// unexplained 400 rather than at the seam where it happened.

/**
 * Hard truncation, no ellipsis. The cap is a byte-budget for the prompt, not a
 * display concern, and appending a marker character would spend one of the
 * budgeted characters on decoration. `slice` on a JS string cuts at a UTF-16
 * code unit, which can split a surrogate pair; zod's `.max()` also counts code
 * units, so the cap still holds. A half pair is a replacement glyph in the
 * prompt, which is harmless.
 */
function truncate(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max);
}

/** A string, or `''` for anything else. Keeps the builder total. */
function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** A non-negative integer, or 0. Matches `z.number().int().nonnegative()`. */
function asCount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  const n = Math.trunc(value);
  return n < 0 ? 0 : n;
}

/**
 * A finite number, or 0.
 *
 * zod v3's `z.number()` rejects `NaN`, and `Infinity` would serialize to JSON as
 * `null` and then fail validation on the server, so a non-finite statistic has
 * to become something. 0 is chosen over dropping the whole numeric block because
 * the block's fields are all required once present, and the profiler never
 * produces a non-finite statistic in the first place (`round6` runs on parsed
 * finite values) — this is a floor, not a behaviour.
 */
function asFinite(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** An integer in `[0, 100]`, matching the `qualityScore` field. */
function asScore(value: unknown): number {
  const n = asFinite(value);
  const i = Math.round(n);
  if (i < 0) return 0;
  return i > 100 ? 100 : i;
}

/** A finite coefficient clamped into `[-1, 1]`. */
function asCoefficient(value: unknown): number {
  const n = asFinite(value);
  if (n < -1) return -1;
  return n > 1 ? 1 : n;
}

/** A known `ColumnType`, or `'unknown'`, matching the schema's enum. */
function asColumnType(value: unknown): ColumnType {
  return COLUMN_TYPES.includes(value as ColumnType) ? (value as ColumnType) : 'unknown';
}

// --- Per-column projection ---------------------------------------------------

type InsightColumn = InsightPayload['columns'][number];

/**
 * Projects one `ColumnProfile` onto the schema's column shape.
 *
 * The type-specific blocks are copied field by field rather than spread. A
 * spread would carry `lowerBound`/`upperBound` into the numeric block and blow
 * the `.strict()` check, and — more importantly — it would silently forward any
 * field a future `NumericStats`/`CategoricalStats`/`DatetimeStats` gains. An
 * explicit projection means a new statistic has to be deliberately allow-listed
 * here before it can reach the model.
 *
 * A block is emitted only when `statsComputed` is true and the block is actually
 * present. Requirement 3.13 marks an all-null column not-computed and omits
 * every type-specific block, so such a column reaches the payload as its three
 * counts and nothing else.
 */
function toInsightColumn(column: ColumnProfile): InsightColumn {
  const out: InsightColumn = {
    name: truncate(asString(column?.name), MAX_COLUMN_NAME_CHARS),
    type: asColumnType(column?.type),
    nullCount: asCount(column?.nullCount),
    nonNullCount: asCount(column?.nonNullCount),
    distinctCount: asCount(column?.distinctCount),
  };

  if (column?.statsComputed !== true) return out;

  const numeric = column.numeric;
  if (numeric !== undefined && numeric !== null) {
    // Requirement 6.3: `min`/`max` are the aggregated extrema, and they are
    // numbers — nothing to truncate, no cell text carried.
    out.numeric = {
      min: asFinite(numeric.min),
      max: asFinite(numeric.max),
      mean: asFinite(numeric.mean),
      median: asFinite(numeric.median),
      stdDev: asFinite(numeric.stdDev),
      q1: asFinite(numeric.q1),
      q3: asFinite(numeric.q3),
      outlierCount: asCount(numeric.outlierCount),
    };
  }

  const categorical = column.categorical;
  if (categorical !== undefined && categorical !== null) {
    const source = Array.isArray(categorical.topValues) ? categorical.topValues : [];
    out.categorical = {
      // Most-frequent values are the second Requirement 6.3 exception, so each
      // one is capped at 64 characters. The profiler already emits at most
      // `MAX_TOP_VALUES`; the slice restates that bound locally so this function
      // cannot exceed the schema's `.max(10)` on its own.
      topValues: source.slice(0, MAX_TOP_VALUES).map((entry) => ({
        value: truncate(asString(entry?.value), MAX_AGGREGATE_VALUE_CHARS),
        count: asCount(entry?.count),
      })),
    };
  }

  const datetime = column.datetime;
  if (datetime !== undefined && datetime !== null) {
    // `earliest`/`latest` are the datetime minimum and maximum. They are ISO
    // strings derived from cell content, so unlike the numeric extrema they DO
    // get the 64-character cap.
    out.datetime = {
      earliest: truncate(asString(datetime.earliest), MAX_AGGREGATE_VALUE_CHARS),
      latest: truncate(asString(datetime.latest), MAX_AGGREGATE_VALUE_CHARS),
      unparsedCount: asCount(datetime.unparsedCount),
    };
  }

  return out;
}

function toInsightCorrelation(pair: CorrelationPair): InsightPayload['correlations'][number] {
  return {
    columnA: truncate(asString(pair?.columnA), MAX_COLUMN_NAME_CHARS),
    columnB: truncate(asString(pair?.columnB), MAX_COLUMN_NAME_CHARS),
    coefficient: asCoefficient(pair?.coefficient),
  };
}

/**
 * Drops `factor`. It is a display-ordering hint for Requirement 5.7 and is not
 * one of the fields Requirement 6.2 allows, so it would be an unrecognized key.
 * The ordering it produced is already baked into the array order, which is
 * preserved.
 */
function toInsightRecommendation(
  recommendation: CleaningRecommendation,
): InsightPayload['cleaningRecommendations'][number] {
  const column = recommendation?.column;
  return {
    column:
      typeof column === 'string' ? truncate(column, MAX_COLUMN_NAME_CHARS) : null,
    issue:
      recommendation?.issue === 'nulls' ||
      recommendation?.issue === 'duplicates' ||
      recommendation?.issue === 'outliers' ||
      recommendation?.issue === 'unknownType'
        ? recommendation.issue
        : 'unknownType',
    detail: truncate(asString(recommendation?.detail), MAX_RECOMMENDATION_TEXT_CHARS),
    action: truncate(asString(recommendation?.action), MAX_RECOMMENDATION_TEXT_CHARS),
  };
}

// --- Entry point -------------------------------------------------------------

/**
 * Builds the Insight_Payload from a complete `DataProfile` (Requirement 6.1).
 *
 * Emits exactly the seven fields Requirement 6.2 allows and no others:
 * `retainedRowCount`, `totalRowCount`, `duplicateRowCount`, `qualityScore`,
 * `columns` (≤200, names ≤128 chars), `correlations` (≤50) and
 * `cleaningRecommendations` (≤50). `sourceName` is excluded on purpose — see the
 * block comment at the top of this file before changing that.
 *
 * **Returns `null` for a profile with zero columns.** `insightPayloadSchema`
 * puts `.min(1)` on `columns`, so a zero-column body is invalid by definition
 * and there would be nothing for the model to describe anyway. Throwing would
 * make this module non-total, and emitting an invalid payload would trade a
 * local `null` for a remote 400, so the absent case is returned as data and the
 * caller simply does not send a request. In practice it is unreachable:
 * Requirement 1.15 has the parser reject a header row with zero fields, so every
 * `DataProfile` that exists has at least one column.
 *
 * **Over-wide profiles are truncated, not rejected.** `profileDataset`
 * deliberately profiles every column (`MAX_PROFILE_COLUMNS` is a performance
 * bound there, not a semantic one) and leaves enforcement to this layer, which
 * is where Requirement 6.2's 200-column cap actually lives. The first 200
 * columns in header order are sent; the rest are dropped, and the on-screen
 * profile still shows them all.
 *
 * Pure: `profile` is not mutated and every nested object in the result is newly
 * allocated, so the caller cannot alias profile state into the request body.
 */
export function buildInsightPayload(profile: DataProfile): InsightPayload | null {
  const sourceColumns = Array.isArray(profile?.columns) ? profile.columns : [];
  if (sourceColumns.length === 0) return null;

  const sourceCorrelations = Array.isArray(profile?.correlations) ? profile.correlations : [];
  const sourceRecommendations = Array.isArray(profile?.quality?.recommendations)
    ? profile.quality.recommendations
    : [];

  return {
    retainedRowCount: asCount(profile?.retainedRowCount),
    totalRowCount: asCount(profile?.totalRowCount),
    duplicateRowCount: asCount(profile?.duplicateRowCount),
    qualityScore: asScore(profile?.quality?.score),
    columns: sourceColumns.slice(0, MAX_PROFILE_COLUMNS).map(toInsightColumn),
    correlations: sourceCorrelations
      .slice(0, MAX_INSIGHT_CORRELATIONS)
      .map(toInsightCorrelation),
    cleaningRecommendations: sourceRecommendations
      .slice(0, MAX_INSIGHT_RECOMMENDATIONS)
      .map(toInsightRecommendation),
  };
}
