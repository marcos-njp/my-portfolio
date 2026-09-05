# Implementation Plan: CSV Data Profiler

## Overview

Build the profiler bottom-up: scaffolding and shared types first, then the nine pure analysis modules in dependency order (`values` → `type-inference` → `stats` → `profiler` → `chart-recommender` → `quality-scorer`), then the impure adapters (`csv-parse`, `csv-serialize`, `sample-loader`, `download`), then the single server boundary (`insight-schema`, `insight-payload`, `rate-limit`, `route.ts`, `insight-client`), then the exporter, then the state machine hook, then presentational components, and finally the route composition and explanation section.

Implementation language is TypeScript, as specified throughout design.md.

Each of the ten correctness properties from design.md is its own sub-task, placed immediately after the module it covers. `generators.ts` lands before the first property test that needs it.

Every task that changes source ends with the build gate:

```bash
pnpm run test    # vitest --run
pnpm run build
```

## Tasks

- [x] 1. Scaffolding: dependencies, test harness, shared types and constants
  - [x] 1.1 Install pinned dependencies with pnpm
    - `pnpm add papaparse@5.5.3 recharts@2.15.4`
    - `pnpm add -D @types/papaparse@5.3.16 vitest@3.2.4 @vitest/coverage-v8@3.2.4 fast-check@4.3.0 jsdom@26.1.0 @vitejs/plugin-react@5.0.4 @testing-library/react@16.3.0 @testing-library/jest-dom@6.9.1`
    - Confirm latest-stable at install time, then pin exactly (no `^`/`~`), matching the `zod: "3.25.76"` convention
    - Run the build gate
    - _Requirements: 1.6, 4.6_

  - [x] 1.2 Add `vitest.config.ts` and one-shot test scripts
    - Create `vitest.config.ts` at the repo root with `@vitejs/plugin-react` and the `@/` alias resolved to match `tsconfig.json`
    - Default `environment: 'node'`; component test files opt into jsdom via a `// @vitest-environment jsdom` pragma
    - Add `"test": "vitest --run"` and `"test:ui": "vitest --run --coverage"` to `package.json`. Never configure watch mode
    - Run the build gate
    - _Requirements: 1.12, 2.9, 3.12_

  - [x] 1.3 Create `lib/data-profiler/types.ts`
    - Declare `ColumnType`, `ParseIssue`, `ParsedDataset`, `NumericStats`, `CategoricalStats`, `DatetimeStats`, `ColumnProfile`, `CorrelationPair`, `DataProfile`, `ChartKind`, `ChartSpec`, `QualityFactor`, `QualityPenalty`, `CleaningIssue`, `CleaningRecommendation`, `QualityResult` exactly as declared in the Data Models section of design.md
    - Include `statsComputed`, `lowerBound`/`upperBound` on `NumericStats`, and `unbinnableCount` on the histogram `ChartSpec` variant
    - Run the build gate
    - _Requirements: 3.13, 4.10, 5.5_

  - [x] 1.4 Create `lib/data-profiler/constants.ts`
    - Export `ROW_CAP`, `SIZE_CAP_BYTES`, `READ_TIMEOUT_MS`, `INSIGHT_TIMEOUT_MS`, `MAX_PROFILE_COLUMNS`, `MAX_INFER_ROWS`, `MAX_INFER_COLUMNS`, `MAX_CORRELATION_COLUMNS`, `MAX_TOP_VALUES`, `MAX_HISTOGRAM_BINS`, `MAX_CHART_SPECS`, `MAX_RENDERED_RECOMMENDATIONS`, `CHART_TEXT_ALT_VALUE_LIMIT` with the literal values in design.md
    - Export `QUALITY_WEIGHTS` as `{ nulls: 40, duplicates: 25, outliers: 20, unknownTypes: 15 }`
    - Run the build gate
    - _Requirements: 1.3, 1.7, 2.1, 3.7, 4.1, 5.2_

- [x] 2. Value classification and column type inference
  - [x] 2.1 Implement `lib/data-profiler/values.ts`
    - `isNullish(v)`: true when absent, empty after trim, or whitespace-only
    - `parseFiniteNumber(v)`: trim then `Number(v)`, `null` unless `Number.isFinite`
    - `parseAcceptedDate(v)`: ordered attempts ISO 8601, `YYYY-MM-DD`, `MM/DD/YYYY`, `DD/MM/YYYY`, returning UTC epoch ms; slash formats matched by explicit regex with component range checks, never handed to `new Date()`
    - Run the build gate
    - _Requirements: 2.2, 2.3, 2.11, 3.5_

  - [x] 2.2 Write unit tests for `values.ts`
    - Nullish predicate over `""`, `"   "`, `"\t"`, `undefined`
    - Numeric rejection of `NaN`, `Infinity`, `-Infinity`, `""`; acceptance of `007`, `1e3`, `-0`
    - All four accepted date formats plus the ambiguous `03/04/2024` resolving to March 4, and rejection of `2024-02-30`
    - Run the build gate
    - _Requirements: 2.2, 2.3, 2.11_

  - [x] 2.3 Create the fast-check arbitraries in `lib/data-profiler/__tests__/generators.ts`
    - `adversarialField()`, `parsedDatasetArb()`, `typedDatasetArb()`, `numericColumnArb()`, `dataProfileArb()`, `cleanDataProfileArb()` with the adversarial content listed in the Generators table of design.md
    - `numericColumnArb()` uses `fc.double({ noNaN: true, noDefaultInfinity: true })` and must produce the large-magnitude/tiny-spread cancellation case
    - `dataProfileArb()` may produce internally inconsistent but structurally valid profiles; `cleanDataProfileArb()` pins all null, duplicate and outlier counts to 0 with no `unknown` types
    - Run the build gate
    - _Requirements: 1.12, 2.9, 3.9, 3.10, 3.11, 3.12, 4.10, 5.2, 5.8, 5.9, 7.6_

  - [x] 2.4 Implement `lib/data-profiler/type-inference.ts`
    - `inferColumnTypes(dataset)` → `ColumnType[]`, evaluating the fixed precedence `numeric` (≥95%), `datetime` (≥95%), `identifier` (distinct === nonNull and nonNull ≥ 20), `categorical` (distinct ≤ 50% of nonNull), else `unknown`
    - Short-circuit `nonNullCount === 0` to `unknown` before any other condition
    - Guard `MAX_INFER_ROWS`/`MAX_INFER_COLUMNS` and per-column evaluation failure by assigning `unknown` to the affected column while retaining the others
    - Decide only from order-independent aggregates (four counts plus a `Set` size)
    - Run the build gate
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.10, 2.11, 2.12_

  - [x] 2.5 Write unit tests for `type-inference.ts`
    - Table-driven, one case per precedence branch (2.2–2.6), the all-null column (2.7), precedence ordering (2.10), and the over-cap guard (2.12)
    - Run the build gate
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.10, 2.12_

  - [x]* 2.6 Write property test for type inference row-order independence
    - **Property 2: Type inference is independent of row order**
    - Uses `typedDatasetArb()` with `fc.shuffledSubarray`/permutation of rows; `numRuns: 100`
    - Tag the test with the design property comment referencing Property 2
    - **Validates: Requirements 2.9**

- [x] 3. Statistical profiling
  - [x] 3.1 Implement `lib/data-profiler/stats.ts`
    - `quantile(xs, p)` using the R-7 linear interpolation formula from design.md
    - `mean()`, `stdDev()` via Welford's online algorithm, `pearson()` two-pass over pairwise-complete values with clamping to `[-1, 1]`, `round6()`
    - Run the build gate
    - _Requirements: 3.3, 3.7, 3.11_

  - [x] 3.2 Write unit tests for `stats.ts`
    - Hand-computed fixtures for mean, stdDev, and quartiles; `n = 1` returning the single value for every `p`; `p = 0`/`p = 1` returning min/max
    - Pearson on a known dataset plus the large-magnitude/tiny-spread cancellation case
    - Run the build gate
    - _Requirements: 3.3, 3.7, 3.11_

  - [x] 3.3 Implement `lib/data-profiler/profiler.ts`
    - `profileDataset(dataset, types)` → `DataProfile`, single pass with per-column accumulators allocated by inferred type
    - Null/non-null/distinct counts; numeric stats with IQR outlier bounds recorded on `NumericStats`; categorical top-10 with descending-count then ascending-string tie-break; datetime earliest/latest/unparsedCount
    - Duplicate row detection by `\u0000`-joined key counting later occurrences only
    - Correlation pairs over the first `MAX_CORRELATION_COLUMNS` qualifying numeric columns (n ≥ 3 pairwise complete), zero-variance columns excluded, sorted by descending `|r|` then ascending column names; empty list when fewer than two qualify
    - `statsComputed: false` with type-specific blocks omitted when `nonNullCount === 0`
    - Pure and total: no `Date.now()`, no `Math.random()`, no input mutation
    - Run the build gate
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.13, 3.15_

  - [x] 3.4 Write unit tests for `profiler.ts`
    - Hand-computed numeric stats and outlier bounds; the `iqr === 0` collapse case
    - Categorical 10-most-frequent tie-break (3.4); datetime earliest/latest and unparsed count (3.5)
    - Duplicate counting where three identical rows contribute 2 (3.6)
    - Correlation tie-break ordering (3.7), zero-variance exclusion (3.8), empty-list case (3.15), empty-column omission (3.13)
    - Run the build gate
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.13, 3.15_

  - [x]* 3.5 Write property test for row accounting
    - **Property 3: Every retained row is accounted for in every column**
    - Profiles datasets from `parsedDatasetArb()`; `numRuns: 100`
    - **Validates: Requirements 3.9**

  - [x]* 3.6 Write property test for quartile ordering
    - **Property 4: Quartiles are ordered**
    - Asserts `min <= q1 <= median <= q3 <= max` for numeric columns with `nonNullCount >= 1`, using `numericColumnArb()`; `numRuns: 100`
    - **Validates: Requirements 3.10**

  - [ ]* 3.7 Write property test for correlation bounds
    - **Property 5: Correlation coefficients are bounded and finite**
    - Asserts every recorded coefficient is finite and within `[-1, 1]`, using `numericColumnArb()`-backed datasets; `numRuns: 100`
    - **Validates: Requirements 3.11**

  - [ ]* 3.8 Write property test for profiling determinism and non-mutation
    - **Property 6: Profiling is deterministic and non-mutating**
    - Profiles twice and deep-equals the results, and deep-equals the input dataset against a pre-call snapshot; `numRuns: 100`
    - **Validates: Requirements 3.12**

- [x] 4. Checkpoint - analysis core
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Profile-driven chart recommendation
  - [x] 5.1 Implement `lib/data-profiler/chart-recommender.ts`
    - `recommendCharts(profile)` → `ChartSpec[]`
    - Histogram: `binCount = min(MAX_HISTOGRAM_BINS, distinctNonNullCount)` with the `v === max` last-bin special case and `unbinnableCount` recorded for non-null non-numeric values
    - Bar for categorical columns (top 10, descending frequency, lexicographic tie-break); one line spec for the leftmost qualifying datetime/numeric pair with ascending-x points; one scatter spec for the largest `|r| >= 0.5` pair with the documented tie-break
    - Emit a 1–200 character `reason` on every spec naming the chart type, source column names, and each source `ColumnType`
    - Build per-type lists sorted by column index, concatenate as line, scatter, histogram, bar, then `slice(0, MAX_CHART_SPECS)`
    - Return `[]` when no profile is available or every column type is absent
    - Run the build gate
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 4.10, 4.11_

  - [-] 5.2 Write unit tests for `chart-recommender.ts`
    - One case per emission rule (4.2–4.5) and its preconditions; type-then-column ordering (4.1); the 12-spec cap; the zero-chartable-columns case (4.8); the missing-profile case (4.11); `reason` length bounds (4.7)
    - Run the build gate
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 4.8, 4.11_

  - [ ]* 5.3 Write property test for histogram bin conservation
    - **Property 7: Histogram bins conserve the non-null count**
    - Asserts `Σ bin.count + unbinnableCount === sourceColumn.nonNullCount` and `bins.length === binCount`; `numRuns: 100`
    - **Validates: Requirements 4.10, 4.2**

  - [ ]* 5.4 Add deterministic scatter downsampling above 5,000 points
    - Fixed-stride selection in `chart-recommender.ts` so SVG node count stays bounded; recorded statistics unaffected and the true total retained for the text alternative
    - Run the build gate
    - _Requirements: 4.6_

- [ ] 6. Data quality scoring
  - [x] 6.1 Implement `lib/data-profiler/quality-scorer.ts`
    - `scoreQuality(profile)` → `QualityResult`
    - Four ratios (nulls, duplicates, outliers, unknownTypes), each 0 when its denominator is 0; `penalty = clamp(round(weight * ratio), 0, weight)`; `score = 100 - Σpenalty`
    - Return exactly four penalties in fixed order
    - Emit cleaning recommendations: per column with nulls (count, percentage to 1dp, action), dataset-level duplicates, per numeric column with outliers naming the IQR bounds, per `unknown` column with a manual review action; each tagged with its `factor`
    - Run the build gate
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.8, 5.9_

  - [-] 6.2 Write unit tests for `quality-scorer.ts`
    - One case per recommendation emission rule (5.3–5.6) including the null percentage rounding and the IQR bounds text
    - Zero-denominator ratios; the zero-recommendation case (5.11)
    - Run the build gate
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.11_

  - [ ]* 6.3 Write property test for quality score arithmetic
    - **Property 8: Quality score arithmetic is exact and bounded**
    - Uses `dataProfileArb()`; asserts exactly four integer penalties each within `[0, weight]`, `Σpenalty === 100 - score`, and `score` an integer within `[0, 100]`; `numRuns: 100`
    - **Validates: Requirements 5.2, 5.8**

  - [ ]* 6.4 Write property test for the clean-dataset score
    - **Property 9: A clean dataset scores 100**
    - Uses `cleanDataProfileArb()` including the 0-row and single-column cases; asserts `score === 100` and all four penalties are 0; `numRuns: 100`
    - **Validates: Requirements 5.9**

- [~] 7. Checkpoint - recommendation and scoring
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. CSV intake, samples, and download adapters
  - [~] 8.1 Implement `lib/data-profiler/csv-serialize.ts`
    - `serializeDataset()` producing RFC 4180 text: quote fields containing a comma, double quote, CR or LF, and escape embedded quotes by doubling
    - Run the build gate
    - _Requirements: 1.12_

  - [~] 8.2 Implement `lib/data-profiler/csv-parse.ts`
    - `parseCsvFile(file, handlers, signal)` → `Promise<ParseOutcome>` and `parseCsvText(text, sourceName)` → `ParseOutcome`
    - `ParseRejection` discriminated union with the `size`, `extension`, `empty`, `header`, `read` variants from design.md
    - Papaparse streaming `chunk` mode over the `File` (`chunkSize: 1MB`, `worker: false`); progress as `Math.round(cursor / file.size * 100)` throttled to 250ms
    - Size cap and extension checks before any read; header validation (no fields, empty name, duplicate name) before row parsing; zero-data-row rejection
    - Retain the first `ROW_CAP` rows while counting `totalRowCount` and setting `truncated`; record ragged rows in `issues` and continue
    - Abort on `signal.aborted` from the chunk callback, and arm a `READ_TIMEOUT_MS` timer that aborts and returns `{ kind: 'read', reason: 'timeout' }`
    - Run the build gate
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.14, 1.15_

  - [~] 8.3 Write unit tests for `csv-parse.ts` and `csv-serialize.ts`
    - Quoted fields with commas, embedded doubled quotes, and CRLF inside a field; size and extension rejections issuing no read; each header rejection reason; zero-data-row rejection; ragged row recorded with both field counts while parsing continues; row-cap truncation counts; progress callback fired with whole numbers 0–100; abort mid-read; timeout path with fake timers
    - Run the build gate
    - _Requirements: 1.4, 1.5, 1.7, 1.8, 1.9, 1.10, 1.14, 1.15_

  - [ ]* 8.4 Write property test for CSV parse round trip
    - **Property 1: CSV parse round trip**
    - `parsedDatasetArb()` → `serializeDataset()` → `parseCsvText()`; asserts identical header names in identical order and identical retained row values; `numRuns: 100`
    - **Validates: Requirements 1.12**

  - [~] 8.5 Add the sample CSV assets and their index
    - Create three curated CSVs under `public/samples/` (roughly 150–400 rows each): a mixed-type sales dataset with intentional nulls and duplicates, a time-series dataset exercising the line-chart path, and a wide categorical survey dataset
    - Create `data/profiler-samples.ts` exporting the id, label, and data row count for each, between 1 and 10 entries
    - Run the build gate
    - _Requirements: 1.1_

  - [~] 8.6 Implement `lib/data-profiler/sample-loader.ts`
    - `loadSampleDataset(id)` fetching the CSV text from `public/samples/` and returning it, so no component issues a bare `fetch`
    - Run the build gate
    - _Requirements: 1.1, 1.2_

  - [~] 8.7 Implement `lib/data-profiler/download.ts`
    - `triggerDownload(filename, mime, text)` creating a Blob and object URL, clicking a synthetic anchor, and revoking the URL in a `finally` block; throw on failure so the caller can surface the export error
    - Run the build gate
    - _Requirements: 7.1, 7.2, 7.5, 7.8_

- [ ] 9. Insight service: schema, payload, rate limiter, route, client
  - [~] 9.1 Implement `lib/data-profiler/insight-schema.ts`
    - `insightPayloadSchema` and `insightNarrativeSchema` exactly as declared in design.md, with `.strict()` on every object including nested ones, and the `.max()` field-count and string-length caps
    - Export the `InsightPayload` and `InsightNarrative` inferred types
    - Run the build gate
    - _Requirements: 6.2, 6.3, 6.5, 6.8_

  - [~] 9.2 Implement `lib/data-profiler/insight-payload.ts`
    - `buildInsightPayload(profile, quality)` emitting only the fields allowed by 6.2: row counts, duplicate count, quality score, ≤200 columns with names truncated to 128 characters, ≤50 correlations, ≤50 cleaning recommendations
    - Truncate aggregate extrema and top values to 64 characters; exclude `sourceName` and every raw row value
    - Run the build gate
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [~] 9.3 Write unit tests for payload construction
    - Seed a dataset with sentinel cell values and assert no sentinel appears in the built payload except as a truncated min, max, or top value
    - Assert the built payload passes `insightPayloadSchema.strict()` and that no field originates from visitor text input
    - Run the build gate
    - _Requirements: 6.2, 6.3, 6.4_

  - [~] 9.4 Implement `lib/rate-limit.ts`
    - `checkRateLimit(key, limit, windowMs)` → `Promise<RateLimitResult | null>` using an `@upstash/redis` sorted set: `ZREMRANGEBYSCORE` prune, `ZCARD` count, `ZADD` on accept, `EXPIRE` to bound the key
    - `retryAfterMs` computed as oldest remaining score + `windowMs` − now; return `null` when Redis is unavailable so the caller decides
    - Run the build gate
    - _Requirements: 6.10_

  - [~] 9.5 Implement `app/api/profile-insights/route.ts`
    - `export const runtime = 'edge'`, `export const dynamic = 'force-dynamic'`, POST only
    - Guard order: env guard → 500 generic; `checkRateLimit` keyed `profiler:insights:{first x-forwarded-for hop}` at 10 per rolling 60 minutes → 429 with the limit and time remaining, `null` → 503 fail closed; `insightPayloadSchema.strict().safeParse` → 400 naming `error.issues[0].path` with no model request issued
    - `generateObject({ model: groq('openai/gpt-oss-120b'), schema: insightNarrativeSchema, system: INSIGHT_INSTRUCTION, prompt: JSON.stringify(parsed.data) })` — exactly two inputs, the module-level instruction constant and the validated payload
    - Throw or schema-invalid result → 502 with no partial content; success → 200 `{ narrative }`
    - Read secrets only inside the handler; never leak internals in messages
    - Run the build gate
    - _Requirements: 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_

  - [~] 9.6 Write tests for `/api/profile-insights`
    - Adversarial bodies rejected by `.strict()`: extra top-level key, extra nested key, an injected `instruction` field, an over-length column name, over-count arrays — each a 400 naming the first failing path with `generateObject` never invoked
    - `generateObject` mocked to assert exactly two inputs reach it and that the validated object is passed, not the raw body
    - Invalid model result → 502 with no partial narrative; missing env → 500 generic message; `checkRateLimit` returning `null` → 503
    - Run the build gate
    - _Requirements: 6.5, 6.6, 6.7, 6.9_

  - [~] 9.7 Implement `lib/data-profiler/insight-client.ts`
    - `requestInsights(payload, signal)` posting to `/api/profile-insights` with an `INSIGHT_TIMEOUT_MS` abort timer, mapping non-200 statuses to the returned message and the timeout to its own outcome
    - Run the build gate
    - _Requirements: 6.1, 6.11, 6.13_

  - [ ]* 9.8 Write a rate limiter integration test
    - One run against Redis asserting the 429 path and the reported time remaining; no repeated iterations
    - Run the build gate
    - _Requirements: 6.10_

- [~] 10. Checkpoint - server boundary
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Report export
  - [~] 11.1 Implement `lib/data-profiler/report-exporter.ts`
    - `toMarkdownReport()` and `toJsonReport()` returning strings, both including source dataset name, retained row count, total row count, duplicate row count, quality score, every column profile, every correlation pair, every cleaning recommendation, and the export timestamp as an ISO 8601 UTC string
    - When no narrative is available, populate every other section and mark the narrative section as not generated
    - Pure string production only; nothing is parsed back into the DOM
    - Run the build gate
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6_

  - [~] 11.2 Write unit tests for `report-exporter.ts`
    - Markdown content checklist covering every field required by 7.3; the missing-narrative branch (7.4); file name containing dataset name, timestamp, and the correct extension
    - Run the build gate
    - _Requirements: 7.3, 7.4_

  - [ ]* 11.3 Write property test for the JSON export round trip
    - **Property 10: JSON export round trip**
    - `dataProfileArb()` → `toJsonReport()` → `JSON.parse` → deep-equal against the input profile; `numRuns: 100`
    - **Validates: Requirements 7.6**

- [ ] 12. Client state machine
  - [~] 12.1 Implement `lib/data-profiler/use-profiler.ts`
    - `ProfilerStatus` discriminated union and the nine-field `ProfilerState` from design.md
    - Drive the transitions in the state diagram: idle → reading → parsing → profiling → profiled, insight pending, and every error edge
    - Cancellation via one `AbortController` per run plus a monotonic `runId` ref guard checked in every async completion handler
    - `reset()` aborts, increments `runId`, and clears dataset, profile, charts, narrative, issues, notice, and chartErrors in a single state update
    - Loading a second dataset performs the same clear-then-increment before any new result is computed
    - Ignore insight activations while `status.kind === 'insightPending'`
    - React state only: no `localStorage`, `sessionStorage`, or `IndexedDB`
    - Run the build gate
    - _Requirements: 1.7, 1.11, 3.14, 4.11, 4.12, 5.10, 5.11, 5.12, 6.12, 8.1, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [~] 12.2 Write tests for `use-profiler.ts`
    - Deferred parse and deferred fetch with fake timers: reset during each drops the late result (8.7)
    - A second load never renders two datasets' column profiles together (8.4)
    - Storage APIs are never touched (8.5, 8.6)
    - Repeat insight activation while pending is ignored (6.12); insight timeout returns the control to activatable (6.13)
    - Run the build gate
    - _Requirements: 6.12, 6.13, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ] 13. Components
  - [~] 13.1 Create the `ProgressBar` primitive at `components/ui/progress-bar.tsx`
    - Determinate bar, `bg-secondary` track and `bg-primary` fill, tokens only
    - `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
    - Run the build gate
    - _Requirements: 1.8, 5.7_

  - [~] 13.2 Build `intake-panel.tsx` and `parse-progress.tsx`
    - Visually hidden `<input type="file">` labelled by a `Button`; `Select` for the sample picker showing each entry's name and data row count
    - `ProgressBar` plus the percentage numeral in `.nm-display`; `AlertBox` for size, extension, empty-file, header, and read errors, and the row-cap `info` notice
    - `min-h-11 min-w-11` targets at the base breakpoint
    - Run the build gate
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.7, 1.8, 1.9, 1.11, 1.14, 1.15, 9.5_

  - [~] 13.3 Build `profile-summary.tsx`, `column-profile-table.tsx`, and `correlation-list.tsx`
    - `MetricGrid`/`MetricCard` for retained rows, total rows, columns, and duplicates
    - Column table listing every column with its `ColumnType` adjacent to the name, including `unknown` and undetermined columns, with `tabular-nums` on the statistics columns; omitted stats shown as not computed
    - Correlation list in the profile's supplied order
    - Run the build gate
    - _Requirements: 2.8, 2.12, 3.2, 3.3, 3.4, 3.5, 3.13_

  - [~] 13.4 Build `chart-grid.tsx`, `chart-card.tsx`, and `chart-text-alternative.tsx`
    - `chart-card.tsx` is a pure switch over `ChartSpec.kind` rendering Recharts series with colors read as `var(--chart-1)`…`var(--chart-5)` and `isAnimationActive` driven by the reduced-motion flag
    - `<figure aria-labelledby aria-describedby>` with the recommendation `reason` in a visible `figcaption`, the SVG wrapped in `role="img"` and `aria-hidden` internals, and an `sr-only` `<table>` of at most `CHART_TEXT_ALT_VALUE_LIMIT` plotted values stating the true total when longer
    - Per-card error boundary rendering an inline message naming the failed chart while the remaining charts render in order
    - Histogram cards display the `unbinnableCount` excluded-values note
    - No-chartable-columns state listing every column name and type
    - Run the build gate
    - _Requirements: 4.6, 4.7, 4.8, 4.9, 4.12, 9.6_

  - [ ]* 13.5 Write component tests for chart accessibility structure
    - `figure`/`figcaption`/`sr-only` table structure, the 30-value cap and total-count statement, `aria-hidden` on the SVG, and one failing card leaving siblings rendered
    - Run the build gate
    - _Requirements: 4.9, 4.12_

  - [~] 13.6 Build `quality-panel.tsx`
    - Score numeral in `.nm-display` with a `ProgressBar` meter, the four penalty contributions in a `MetricGrid`, and cleaning recommendations via `TroubleshootCard` ordered by descending penalty of the producing factor
    - "No cleaning actions required" indicator when the list is empty; first `MAX_RENDERED_RECOMMENDATIONS` plus the undisplayed count when over 100; "profiling must complete before scoring" when no profile exists
    - Run the build gate
    - _Requirements: 5.7, 5.10, 5.11, 5.12_

  - [~] 13.7 Build `insight-panel.tsx`
    - Insight control with no free-text input, a pending state, and rendering of the summary, observations, and suggested next analyses as escaped JSX text children
    - `HighlightBox` stating the narrative is generated from aggregated statistics and raw rows stay in the browser, adjacent to both the control and any rendered narrative
    - Error and timeout messages displayed without disturbing the profile, charts, or score
    - Run the build gate
    - _Requirements: 6.4, 6.11, 6.12, 6.13, 6.14, 6.15_

  - [~] 13.8 Build `export-controls.tsx`
    - Markdown and JSON controls wired to `report-exporter.ts` and `triggerDownload`, with a pending state until the download starts or an error is shown
    - `disabled` attribute when no profile is available, so pointer and keyboard activation are both rejected
    - On failure, show an error naming the requested format and stating no file was saved, then re-enable the control
    - Run the build gate
    - _Requirements: 7.1, 7.2, 7.5, 7.7, 7.8, 7.9_

  - [~] 13.9 Build `profiler-explainer.tsx`
    - Visible without profiling; `Tabs` for Type inference, Outliers, Quality weights, and Privacy
    - State the numeric thresholds for every `ColumnType`, the IQR outlier rule, each quality factor with its weight and the weighting rationale, and that the payload carries derived data only
    - `CodeBlock` showing the literal `Insight_Payload` shape, `StepList` for the pipeline walkthrough, and `ComparisonGrid` contrasting injection filtering against derived-data-only
    - Run the build gate
    - _Requirements: 9.3_

  - [ ]* 13.10 Write component tests for motion, disabled states, and keyboard behavior
    - Reduced motion: `isAnimationActive={false}` and zero-duration transitions
    - Insight and export controls disabled before any profile, with the "profile a dataset first" message
    - Tab order matching visual order, Enter and Space activation, and a rendered focus indicator
    - Run the build gate
    - _Requirements: 9.4, 9.6, 9.7_

  - [ ]* 13.11 Write the design-system guard test
    - Source scan asserting no hex color literal and no `style={{ }}` attribute appears under `components/playground/data-profiler/`
    - Run the build gate
    - _Requirements: 9.2_

- [ ] 14. Route composition and wiring
  - [~] 14.1 Create `app/playground/layout.tsx`
    - `"use client"`; header plus `ThemeToggle`, mirroring `app/docs/layout.tsx` minus `DocsSidebar`, tokens only
    - Run the build gate
    - _Requirements: 9.2_

  - [~] 14.2 Create `app/playground/data-profiler/page.tsx` and `content.tsx`
    - `page.tsx`: server component exporting metadata and wrapping `content.tsx` in `Suspense` with the `h-8` + `h-64` `bg-muted animate-pulse` skeleton shape from `app/docs/page.tsx`
    - `content.tsx`: `"use client"`, reads `useReducedMotion()` once, consumes `use-profiler.ts`, and composes `DocPageLayout` + `DocSection` around the intake, profile, charts, quality, insight, export, and explainer panels
    - Reset control present and keyboard-operable while a dataset is loaded, omitted or disabled otherwise
    - Single-column base layout with `sm:`/`md:` upgrades and no horizontal scrolling from 320px
    - Run the build gate
    - _Requirements: 8.1, 8.2, 8.8, 9.1, 9.2, 9.5, 9.6, 9.7_

  - [~] 14.3 Write no-transmission tests for the composed page
    - `fetch` spied on: never called with row data during parse, profile, or export; the only outbound call is `/api/profile-insights` carrying a schema-valid derived payload
    - Run the build gate
    - _Requirements: 1.13, 7.5, 6.11_

- [ ]* 15. Write the performance and timing integration tests
  - Inference ≤ 3s on 100,000 × 100; profiling ≤ 10s on 50,000 × 200; scoring ≤ 2s; serialization ≤ 5s; initial render ≤ 3s as a smoke test
  - 1–3 runs each, never as property tests
  - Run the build gate
  - _Requirements: 2.1, 3.1, 5.1, 7.9, 9.1_

- [~] 16. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP. Core implementation, the API route guards, and the unit tests that cover requirement branches are never optional.
- Requirement 4.10 is implemented as `Σ bin.count + unbinnableCount === nonNullCount` per the conflict resolution in design.md. If the requirements author rules otherwise, task 5.1 and property test 5.3 both change.
- Every task ends with `pnpm run test` then `pnpm run build`; `pnpm run start` for production verification after task 14.2.
- Property tests use `fast-check` at `numRuns: 100` minimum, exactly one test per design property, each tagged with a comment naming the feature and property.
- Failing counterexamples get committed as regression unit tests once fixed.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3", "1.4", "8.5", "13.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "2.3", "8.1"] },
    { "id": 2, "tasks": ["2.2", "2.4", "3.1", "8.2"] },
    { "id": 3, "tasks": ["2.5", "2.6", "3.2", "3.3", "8.3", "8.6", "8.7", "9.1"] },
    { "id": 4, "tasks": ["3.4", "3.5", "3.6", "3.7", "3.8", "5.1", "6.1", "8.4", "9.2", "9.4"] },
    { "id": 5, "tasks": ["5.2", "5.3", "5.4", "6.2", "6.3", "6.4", "9.3", "9.5", "9.7", "11.1"] },
    { "id": 6, "tasks": ["9.6", "9.8", "11.2", "11.3", "12.1"] },
    { "id": 7, "tasks": ["12.2", "13.2", "13.3", "13.4", "13.6", "13.7", "13.8", "13.9"] },
    { "id": 8, "tasks": ["13.5", "13.10", "14.1", "14.2"] },
    { "id": 9, "tasks": ["13.11", "14.3", "15"] }
  ]
}
```
