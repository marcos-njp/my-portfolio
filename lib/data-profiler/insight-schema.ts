// lib/data-profiler/insight-schema.ts
//
// The wire contract for the one server boundary this feature has:
// `POST /api/profile-insights`. Imported by BOTH the client (to type the payload
// it builds) and the Edge route (to validate what arrived), so this module must
// stay free of browser-only and Node-only imports. `zod` is the only import and
// it is isomorphic.
//
// zod is pinned at 3.25.76, so this is the v3 API: `.strict()` is a method on
// `ZodObject` and `z.infer<typeof schema>` reads the output type. No v4-only
// syntax (no `z.strictObject`, no top-level `z.iso.*`) appears here.
//
// _Requirements: 6.2, 6.3, 6.5, 6.8_
//
// --- Why `.strict()` is on EVERY object, including nested ones ----------------
//
// Requirement 6.5 requires the service to treat as invalid any body that
// *contains a field absent from the schema*. zod's default object behaviour is
// to strip unknown keys silently and report success, which would satisfy the
// type but not the requirement: the request would be accepted, and the caller
// would have no way to know something extra was sent. `.strict()` turns an
// unknown key into an `unrecognized_keys` issue, so `safeParse` fails and the
// route answers 400 (Requirement 6.6) *before* any model request is issued.
//
// This is the whole security story of the feature. The payload has no free-text
// field by construction (Requirement 6.4), so the only way to smuggle prompt
// text to the model would be to bolt an extra field onto the body — an
// `instruction`, a `system`, a `rows` array — and hope it rides along into the
// prompt. With `.strict()` at every level, such a body is rejected at the
// boundary. A single non-strict nested object would be exactly that hole: an
// attacker would nest the smuggled field one level deeper
// (`columns[0].instruction`) and the strict top-level object would never see it.
// Depth-uniform strictness is what makes the "derived aggregates only"
// guarantee this feature advertises an exact guarantee rather than a claim.
//
// --- Why the caps are what they are, and why they must not be relaxed --------
//
// Every cap here mirrors what the client already truncates to in
// `insight-payload.ts`: `.max(200)` columns (`MAX_PROFILE_COLUMNS`), `.max(50)`
// on correlations and cleaning recommendations, `.max(128)` on column names,
// `.max(64)` on aggregate extrema and top values. A well-formed client
// therefore *cannot* trip any of them — only a hand-crafted or tampered body
// can. That is the point: the caps are not defensive slack for legitimate
// traffic, they are the enforcement half of Requirements 6.2 and 6.3, and they
// bound how much attacker-influenced text can reach the model prompt at all.
// Raising one to "fix" a rejection would be fixing the wrong end; the client's
// truncation is the thing to look at. Nothing legitimate needs more room.

import { z } from 'zod';

/**
 * A string with a hard maximum length. Named for what the client does to reach
 * this shape — the value has already been truncated by `buildInsightPayload`,
 * so a value that fails this check did not come from our client.
 */
const truncated = (max: number) => z.string().max(max);

const insightNumericSchema = z
  .object({
    min: z.number(),
    max: z.number(),
    mean: z.number(),
    median: z.number(),
    stdDev: z.number(),
    q1: z.number(),
    q3: z.number(),
    outlierCount: z.number().int().nonnegative(),
  })
  .strict();

const insightCategoricalSchema = z
  .object({
    topValues: z
      .array(
        z
          .object({
            value: truncated(64),
            count: z.number().int().nonnegative(),
          })
          .strict(),
      )
      .max(10),
  })
  .strict();

const insightDatetimeSchema = z
  .object({
    earliest: truncated(64),
    latest: truncated(64),
    unparsedCount: z.number().int().nonnegative(),
  })
  .strict();

export const insightColumnSchema = z
  .object({
    name: truncated(128),
    type: z.enum(['numeric', 'categorical', 'datetime', 'identifier', 'unknown']),
    nullCount: z.number().int().nonnegative(),
    nonNullCount: z.number().int().nonnegative(),
    distinctCount: z.number().int().nonnegative(),
    numeric: insightNumericSchema.optional(),
    categorical: insightCategoricalSchema.optional(),
    datetime: insightDatetimeSchema.optional(),
  })
  .strict();

export const insightPayloadSchema = z
  .object({
    retainedRowCount: z.number().int().nonnegative(),
    totalRowCount: z.number().int().nonnegative(),
    duplicateRowCount: z.number().int().nonnegative(),
    qualityScore: z.number().int().min(0).max(100),
    columns: z.array(insightColumnSchema).min(1).max(200),
    correlations: z
      .array(
        z
          .object({
            columnA: truncated(128),
            columnB: truncated(128),
            coefficient: z.number().min(-1).max(1),
          })
          .strict(),
      )
      .max(50),
    cleaningRecommendations: z
      .array(
        z
          .object({
            column: truncated(128).nullable(),
            issue: z.enum(['nulls', 'duplicates', 'outliers', 'unknownType']),
            detail: truncated(240),
            action: truncated(240),
          })
          .strict(),
      )
      .max(50),
  })
  .strict();

/**
 * The structured narrative shape from Requirement 6.8. Handed to
 * `generateObject` as its `schema`, so the model is constrained at generation
 * time, and re-validated on the result before the route responds — the
 * "validate the model result before responding" half of 6.8.
 */
export const insightNarrativeSchema = z
  .object({
    // 2000, not 1200. The old ceiling sat almost exactly at the length this
    // model naturally writes for a six-column profile: one sampled run landed
    // at 1192 characters and two others overran, and an overrun is not a
    // truncation here, it is a thrown `NoObjectGeneratedError` and a 502 with
    // no narrative at all. The instruction now states a much smaller budget, so
    // this is the safety margin behind that request rather than the target.
    summary: z.string().min(1).max(2000),
    observations: z.array(z.string().min(1).max(300)).min(3).max(7),
    nextAnalyses: z.array(z.string().min(1).max(200)).min(2).max(5),
  })
  .strict();

export type InsightPayload = z.infer<typeof insightPayloadSchema>;
export type InsightNarrative = z.infer<typeof insightNarrativeSchema>;
