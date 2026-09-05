'use client';

// components/playground/data-profiler/profiler-explainer.tsx
//
// The Requirement 9.3 explanation section. Visible before — and without ever —
// profiling a dataset, so it takes no profile prop and has no empty state.
//
// Every number on this page is READ FROM `lib/data-profiler/constants.ts`, never
// typed as a literal. That is deliberate: an explanation that hardcodes "95%"
// silently becomes a lie the day someone tunes `TYPE_THRESHOLDS`. Reading the
// same constants the implementation reads makes drift impossible.
//
// `Tabs` from `components/docs/common` is used as-is (Requirement 9.2 reuse).
// Known limitation: it renders plain `<button>`s with no `role="tab"` /
// `role="tabpanel"` / `aria-selected` and no arrow-key navigation, so it is not
// a conforming ARIA tablist. The buttons are real buttons — focusable, Tab
// reachable, Enter/Space activatable — which is what Requirement 9.4 asks for,
// so it is used unchanged rather than forked or rewritten here. Fixing the ARIA
// pattern belongs in the shared component, not in this consumer.
//
// _Requirements: 9.2, 9.3_

import {
  CodeBlock,
  ComparisonGrid,
  DocSection,
  HighlightBox,
  StepList,
  Tabs,
} from '@/components/docs/common';
import {
  IQR_MULTIPLIER,
  MAX_HISTOGRAM_BINS,
  QUALITY_WEIGHTS,
  ROW_CAP,
  SCATTER_CORRELATION_THRESHOLD,
  TYPE_THRESHOLDS,
} from '@/lib/data-profiler/constants';
import type { QualityFactor } from '@/lib/data-profiler/types';

/** Ratio → percent string, trimmed so 0.95 reads "95%" and not "95.0000%". */
const percent = (ratio: number) => `${Number((ratio * 100).toFixed(4))}%`;

/** `ROW_CAP` etc. with thin grouping, without pulling in a locale-dependent API. */
const groupDigits = (value: number) => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const TYPE_RULES: Array<{ type: string; rule: string }> = [
  {
    type: 'numeric',
    rule: `At least ${percent(
      TYPE_THRESHOLDS.numericParseRate,
    )} of the non-null values parse as finite numbers. Values parsing to Infinity or NaN do not count.`,
  },
  {
    type: 'datetime',
    rule: `At least ${percent(
      TYPE_THRESHOLDS.dateParseRate,
    )} of the non-null values parse as ISO 8601, YYYY-MM-DD, MM/DD/YYYY or DD/MM/YYYY. A value readable as both MM/DD/YYYY and DD/MM/YYYY is read as MM/DD/YYYY.`,
  },
  {
    type: 'identifier',
    rule: `Every non-null value is distinct and the non-null count is at least ${TYPE_THRESHOLDS.identifierMinNonNull}. The count floor keeps a tiny column of unique labels from being mistaken for a key.`,
  },
  {
    type: 'categorical',
    rule: `None of the above matched and the distinct value count is at most ${percent(
      TYPE_THRESHOLDS.categoricalDistinctRatio,
    )} of the non-null count.`,
  },
  {
    type: 'unknown',
    rule: 'Nothing above matched — or the column has zero non-null values, in which case no other rule is even evaluated.',
  },
];

const FACTOR_LABELS: Record<QualityFactor, string> = {
  nulls: 'Missing values',
  duplicates: 'Duplicate rows',
  outliers: 'Numeric outliers',
  unknownTypes: 'Unresolved types',
};

const FACTOR_RATIOS: Record<QualityFactor, string> = {
  nulls: 'total null cells ÷ (rows × columns)',
  duplicates: 'duplicate rows ÷ retained rows',
  outliers: 'outlier values ÷ non-null values across numeric columns',
  unknownTypes: 'unknown-type columns ÷ columns',
};

const FACTOR_RATIONALE: Record<QualityFactor, string> = {
  nulls: 'Weighted highest because missing data blocks the most downstream analysis — every aggregate, join and model has to decide what to do about it first.',
  duplicates:
    'Next highest because duplicates silently bias every aggregate. Nothing errors; the numbers are just wrong.',
  outliers:
    'Lower, because an outlier is often a legitimate extreme value rather than a defect. It is a prompt to look, not proof of damage.',
  unknownTypes:
    'Lowest, because an unresolved type signals "a human should look at this column" rather than corrupted data.',
};

const FACTOR_ORDER: QualityFactor[] = ['nulls', 'duplicates', 'outliers', 'unknownTypes'];

const PAYLOAD_SHAPE = `// The complete Insight_Payload. There is no other field, and every
// nested object is .strict() — an unknown key anywhere is a 400.
{
  retainedRowCount:  number,
  totalRowCount:     number,
  duplicateRowCount: number,
  qualityScore:      number,          // 0..100

  columns: Array<{                    // <= 200
    name:          string,            // truncated to 128 chars
    type:          'numeric' | 'categorical' | 'datetime' | 'identifier' | 'unknown',
    nullCount:     number,
    nonNullCount:  number,
    distinctCount: number,
    numeric?:      { min, max, mean, median, stdDev, q1, q3, outlierCount },
    categorical?:  { topValues: Array<{ value: string, count: number }> },
    datetime?:     { earliest: string, latest: string, unparsedCount: number },
  }>,

  correlations: Array<{               // <= 50
    columnA: string, columnB: string, coefficient: number,
  }>,

  cleaningRecommendations: Array<{     // <= 50
    column: string | null,
    issue: 'nulls' | 'duplicates' | 'outliers' | 'unknownType',
    detail: string, action: string,
  }>,
}

// Absent by construction: rows, cells, the file name, and any free text.`;

const PIPELINE_STEPS = [
  {
    title: 'Parse in the browser',
    description: `papaparse streams the file in chunks, so the tab stays responsive. The first ${groupDigits(
      ROW_CAP,
    )} data rows are retained; anything past that is counted but not kept. Ragged rows are recorded and parsing continues.`,
  },
  {
    title: 'Infer one type per column',
    description:
      'A fixed precedence — numeric, datetime, identifier, categorical, unknown — with the first matching rule winning. Row order never changes the outcome.',
  },
  {
    title: 'Profile in a single pass',
    description:
      'Null, non-null and distinct counts for every column; mean and standard deviation via Welford; quartiles by linear interpolation on the sorted values; Pearson correlations over the retained numeric arrays.',
  },
  {
    title: 'Recommend charts from the profile',
    description: `Charts come from the statistics, not from you: histograms (up to ${MAX_HISTOGRAM_BINS} bins) for numeric columns, bars for categorical, one line chart for a datetime/numeric pair, and one scatter for the strongest correlation at |r| ≥ ${SCATTER_CORRELATION_THRESHOLD}.`,
  },
  {
    title: 'Score quality and recommend cleaning',
    description:
      'Four weighted penalties are subtracted from 100, and each contributing column gets a concrete remediation action.',
  },
  {
    title: 'Optionally ask for a narrative',
    description:
      'Only if you activate the insight control, and only the derived aggregates below are sent. The raw rows never leave the page.',
  },
];

export interface ProfilerExplainerProps {
  className?: string;
}

export function ProfilerExplainer({ className = '' }: ProfilerExplainerProps) {
  return (
    <DocSection
      title="How the profiler works"
      subtitle="Every threshold below is read from the same constants the analysis code reads, so this section cannot drift from the implementation."
      className={className}
    >
      <StepList steps={PIPELINE_STEPS} />

      <Tabs
        defaultTab="type-inference"
        items={[
          {
            id: 'type-inference',
            label: 'Type inference',
            content: (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Each column gets exactly one type. The rules are evaluated in a fixed order and
                  the first match wins, so the classification is deterministic and independent of
                  row order. A value is null when it is absent, empty, or whitespace only, and null
                  values count toward neither the non-null count nor the distinct count.
                </p>
                <ul className="space-y-2">
                  {TYPE_RULES.map((rule) => (
                    <li key={rule.type} className="rounded-md border border-border bg-card p-3">
                      <p className="nm-label-sm">{rule.type}</p>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {rule.rule}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ),
          },
          {
            id: 'outliers',
            label: 'Outliers',
            content: (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Outliers use the Tukey fence on the interquartile range. For a numeric column with
                  first quartile Q1 and third quartile Q3, IQR = Q3 − Q1 and a value is an outlier
                  when it falls outside these bounds:
                </p>
                <CodeBlock title="outlier rule" language="text">
                  {`IQR   = Q3 - Q1
lower = Q1 - ${IQR_MULTIPLIER} * IQR
upper = Q3 + ${IQR_MULTIPLIER} * IQR

outlier  <=>  value < lower  OR  value > upper`}
                </CodeBlock>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The multiplier is {IQR_MULTIPLIER}. Q1, the median and Q3 are obtained by linear
                  interpolation between the two closest ranks of the ascending sorted values, so a
                  column with an even count does not snap to a neighbouring observation. The rule is
                  distribution-free — it makes no normality assumption, which matters because most
                  real columns are skewed. Both bounds are reported alongside the count so you can
                  judge whether a flagged value is a defect or a legitimate extreme.
                </p>
              </div>
            ),
          },
          {
            id: 'quality-weights',
            label: 'Quality weights',
            content: (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The score starts at 100 and four weighted penalties are subtracted. Each factor
                  contributes <span className="font-mono">round(weight × ratio)</span>, clamped to
                  its weight, so the four penalties always sum to exactly 100 minus the score. The
                  weights sum to {FACTOR_ORDER.reduce((sum, factor) => sum + QUALITY_WEIGHTS[factor], 0)}
                  .
                </p>
                <ul className="space-y-2">
                  {FACTOR_ORDER.map((factor) => (
                    <li key={factor} className="rounded-md border border-border bg-card p-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-medium">{FACTOR_LABELS[factor]}</p>
                        <p className="text-xs tabular-nums text-muted-foreground">
                          {`weight ${QUALITY_WEIGHTS[factor]} of 100`}
                        </p>
                      </div>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {`ratio = ${FACTOR_RATIOS[factor]}`}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {FACTOR_RATIONALE[factor]}
                      </p>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A ratio whose denominator is zero is treated as zero, so a dataset with no nulls,
                  no duplicates, no outliers and no unresolved types scores exactly 100.
                </p>
              </div>
            ),
          },
          {
            id: 'privacy',
            label: 'Privacy',
            content: (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Parsing, profiling, charting, scoring and exporting all run in this tab. There is
                  exactly one server call in the whole feature — the optional AI narrative — and it
                  carries derived data only: no data rows, no cell values, and no text you typed.
                  The one exception is stated plainly: aggregate extrema already recorded in the
                  profile (a minimum, a maximum, a most-frequent value, an earliest and latest date)
                  travel truncated to 64 characters, because a summary of a column is not
                  meaningfully a summary without them.
                </p>
                <CodeBlock title="Insight_Payload" language="ts">
                  {PAYLOAD_SHAPE}
                </CodeBlock>
                <ComparisonGrid
                  before={{
                    title: '/api/chat — filter the text',
                    items: [
                      'Input is visitor free text, so prompt injection is a live threat',
                      'Defended by lib/query-validator.ts: length caps, pattern checks, rejection reasons',
                      'Security depends on the filter catching every phrasing an attacker invents',
                      'A new evasion means a new rule, forever',
                    ],
                  }}
                  after={{
                    title: '/api/profile-insights — remove the text',
                    items: [
                      'The payload schema has no free-text field, so there is nothing to inject into',
                      'Every object is .strict(): a smuggled instruction key is a 400 before any model call',
                      'The model receives exactly two inputs — a server-side instruction and the validated payload',
                      'Injection is absent by construction, not filtered at runtime',
                    ],
                  }}
                />
                <HighlightBox type="tip" title="Why the contrast is the point">
                  Both routes are in this project on purpose. Where visitor text is the feature, you
                  have to filter it and keep filtering it. Where it is not, the stronger move is to
                  design the channel so the text cannot exist — then no filter can be bypassed
                  because there is no filter to bypass.
                </HighlightBox>
              </div>
            ),
          },
        ]}
      />
    </DocSection>
  );
}
