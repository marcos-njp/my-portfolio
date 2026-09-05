// data/profiler-samples.ts
//
// The Sample_Dataset index for the CSV Data Profiler playground.
//
// Requirement 1.1: the Profiler_UI presents between 1 and 10 Sample_Dataset
// entries, each labeled with its name and its data row count. `label` and
// `rowCount` are therefore both mandatory, and `rowCount` is the *data* row
// count — the header line is excluded.
//
// Consumers:
//   - `lib/data-profiler/sample-loader.ts` (task 8.6) resolves an `id` to a
//     static URL as `${SAMPLES_BASE_PATH}/${filename}` and fetches the text.
//   - The Select control (task 13.2) renders one option per entry, keyed by
//     `id`, showing `label` and `rowCount` (and `description` as help text).
//
// The row counts below were verified by running each file through the real
// parse → infer → profile → score → recommend pipeline; they match
// `ParsedDataset.retainedRowCount` exactly.

/** One curated CSV bundled under `public/samples/`. */
export interface ProfilerSample {
  /** Stable key. Used by `loadSampleDataset(id)` and as the Select option value. */
  id: string;
  /** Display name shown in the Select (Requirement 1.1). */
  label: string;
  /** Data rows, excluding the header line (Requirement 1.1). */
  rowCount: number;
  /** File name under `public/samples/`. */
  filename: string;
  /** One-line summary of what the dataset demonstrates. */
  description: string;
}

/** Public directory the sample CSVs are served from, without a trailing slash. */
export const SAMPLES_BASE_PATH = '/samples';

/**
 * The Sample_Dataset entries, in display order. Between 1 and 10 entries
 * (Requirement 1.1); currently 3.
 *
 * The three are deliberately contrastive: the showcase exercises every path in
 * the pipeline at once, and the other two bracket it at the clean and dirty
 * extremes of the quality score.
 */
export const PROFILER_SAMPLES: readonly ProfilerSample[] = [
  {
    id: 'showcase-ecommerce-orders',
    label: 'E-commerce orders (full showcase)',
    rowCount: 452,
    filename: 'showcase-ecommerce-orders.csv',
    description:
      'One file that exercises everything: all five column types, all four chart kinds, and all four cleaning recommendations. Quality score 85.',
  },
  {
    id: 'clean-weekly-traffic',
    label: 'Weekly web traffic (clean)',
    rowCount: 208,
    filename: 'clean-weekly-traffic.csv',
    description:
      'Four years of tidy weekly metrics with no gaps, duplicates or outliers. Quality score 100 — what a clean dataset looks like.',
  },
  {
    id: 'messy-crm-export',
    label: 'CRM export (messy)',
    rowCount: 304,
    filename: 'messy-crm-export.csv',
    description:
      'A neglected CRM dump: heavy gaps, repeated rows, an all-empty column and mixed date formats. Quality score 64 with a long cleaning list.',
  },
];

/** Resolves an id to its entry, or `undefined` when the id is not one of ours. */
export function findProfilerSample(id: string): ProfilerSample | undefined {
  return PROFILER_SAMPLES.find((sample) => sample.id === id);
}
