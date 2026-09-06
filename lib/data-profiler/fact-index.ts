// lib/data-profiler/fact-index.ts
//
// Turns a `DataProfile` into a set of small, self-contained, retrievable
// statements about the dataset.
//
// --- Why an index at all -----------------------------------------------------
//
// `/api/profile-insights` sends the whole profile in one prompt. That works for
// a fixed narrative, and it does not work for questions: a 200-column profile
// serializes to well over 100KB, most of it irrelevant to "which column has the
// most missing values", and burying the answer in noise is how a model ends up
// confidently citing the wrong column. Splitting the profile into facts lets
// `fact-retriever.ts` send the twelve that bear on the question and nothing
// else.
//
// --- What may become a fact --------------------------------------------------
//
// Only aggregates, by the same rules `insight-payload.ts` follows:
//
//   * `sourceName` is never emitted. It is the visitor's file name, it is not a
//     statistic, and `no-transmission.test.ts` seeds a sentinel there.
//   * `identifier` and `unknown` columns emit their name, type and counts and
//     nothing else. Those are the two types with no summarisable distribution,
//     so any "example value" would be a raw cell.
//   * Categorical top values are already capped at `MAX_TOP_VALUES` upstream and
//     are already transmitted by the insight payload, so they are no new class
//     of exposure.
//
// This module performs no IO. It is called from `useProfiler` the moment a
// profile exists, and building an index must not cost a request: the privacy
// test asserts that profiling issues none at all.

import { FACT_TEXT_CAP, MAX_FACTS } from './constants';
import type { ChartSpec, ColumnProfile, DataProfile } from './types';

export type FactKind =
  | 'dataset'
  | 'column'
  | 'distribution'
  | 'topValues'
  | 'dateRange'
  | 'correlation'
  | 'quality'
  | 'issue'
  | 'chart';

export interface DatasetFact {
  /** Stable and unique, e.g. `col:3:distribution`. Used as the ranking tiebreak. */
  id: string;
  kind: FactKind;
  /**
   * The columns this fact is about, for name boosting during retrieval.
   * A retrieval aid only: never sent to the server.
   */
  columns: string[];
  /** The rendered statement. The only field that ever leaves the browser. */
  text: string;
  /** Lowercased tokens, precomputed once. Never sent to the server. */
  terms: string[];
}

export interface FactIndex {
  facts: DatasetFact[];
  /** term -> how many facts contain it, for inverse document frequency. */
  df: Map<string, number>;
  /** Mean `terms.length`, for BM25 length normalisation. */
  avgLen: number;
  /** Every column name in header order, for the retriever's name matcher. */
  columnNames: string[];
}

/**
 * Splits text into lowercased tokens, and additionally emits the sub-words of a
 * compound identifier.
 *
 * Column names are the highest-signal terms in this corpus and they are rarely
 * plain words: `signup_date`, `orderTotal`, `customer.id`. Emitting both the
 * whole name and its parts means "when did signups start" reaches `signup_date`
 * without the caller having to guess the delimiter the file used.
 */
export function tokenize(text: string): string[] {
  const out: string[] = [];
  const spaced = text.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  for (const raw of spaced.toLowerCase().split(/[^a-z0-9.]+/)) {
    // The dot stays inside a token so `customer.id` survives as one term, which
    // also means a run of dots (an ellipsis in the surrounding prose) survives
    // the split. Drop anything with no alphanumeric in it.
    if (raw === '' || !/[a-z0-9]/.test(raw)) continue;
    out.push(raw);
    if (raw.includes('.')) {
      for (const part of raw.split('.')) {
        if (part !== '' && part !== raw) out.push(part);
      }
    }
  }
  return out;
}

/** Trims a rendered statement to the wire cap. */
function cap(text: string): string {
  return text.length <= FACT_TEXT_CAP ? text : `${text.slice(0, FACT_TEXT_CAP - 3)}...`;
}

/**
 * Formats a number for prose. `Number.prototype.toString` is used rather than
 * `toLocaleString` for the same reason `chart-text-alternative.tsx` avoids it:
 * a locale-dependent separator makes the server and the browser disagree.
 */
function num(value: number | undefined | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'n/a';
  return String(value);
}

function percent(part: number, whole: number): string {
  if (!Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) return '0.0';
  return ((part / whole) * 100).toFixed(1);
}

function factOf(id: string, kind: FactKind, columns: string[], text: string): DatasetFact {
  const capped = cap(text);
  return {
    id,
    kind,
    columns,
    terms: tokenize(`${columns.join(' ')} ${capped}`),
    text: capped,
  };
}

/** The statements a single column contributes, in a fixed order. */
function columnFacts(column: ColumnProfile, index: number, rowCount: number): DatasetFact[] {
  const name = column.name;
  const out: DatasetFact[] = [
    factOf(
      `col:${index}:column`,
      'column',
      [name],
      `Column ${name}. Type: ${column.type}. Non-null: ${num(column.nonNullCount)}. ` +
        `Missing: ${num(column.nullCount)} of ${num(rowCount)} rows ` +
        `(${percent(column.nullCount, rowCount)}%). Distinct: ${num(column.distinctCount)}.`,
    ),
  ];

  // `statsComputed` is false when the column is entirely null, in which case
  // every stat below would be a placeholder rather than a fact.
  if (!column.statsComputed) return out;

  if (column.type === 'numeric' && column.numeric !== undefined) {
    const s = column.numeric;
    out.push(
      factOf(
        `col:${index}:distribution`,
        'distribution',
        [name],
        `Distribution of ${name}. Min ${num(s.min)}, Q1 ${num(s.q1)}, median ${num(s.median)}, ` +
          `mean ${num(s.mean)}, Q3 ${num(s.q3)}, max ${num(s.max)}. ` +
          `Standard deviation ${num(s.stdDev)}. ` +
          `Outliers: ${num(s.outlierCount)} outside [${num(s.lowerBound)}, ${num(s.upperBound)}].`,
      ),
    );
  }

  if (column.type === 'categorical' && column.categorical !== undefined) {
    const top = column.categorical.topValues
      .map((entry) => `${entry.value} (${num(entry.count)})`)
      .join(', ');
    out.push(
      factOf(
        `col:${index}:topValues`,
        'topValues',
        [name],
        `Most frequent values in ${name}: ${top === '' ? 'none' : top}.`,
      ),
    );
  }

  if (column.type === 'datetime' && column.datetime !== undefined) {
    const d = column.datetime;
    out.push(
      factOf(
        `col:${index}:dateRange`,
        'dateRange',
        [name],
        `Date range of ${name}. Earliest ${d.earliest}, latest ${d.latest}. ` +
          `Unparsed: ${num(d.unparsedCount)}.`,
      ),
    );
  }

  // `identifier` and `unknown` fall through with the column fact alone. That is
  // deliberate and is the property `fact-index.property.test.ts` pins.
  return out;
}

function chartFact(spec: ChartSpec, index: number): DatasetFact {
  const columns =
    spec.kind === 'histogram' || spec.kind === 'bar'
      ? [spec.column]
      : [spec.xColumn, spec.yColumn];
  return factOf(
    `chart:${index}`,
    'chart',
    columns,
    `Recommended ${spec.kind} chart. ${spec.reason}`,
  );
}

/**
 * Builds the retrievable index for one profile.
 *
 * Deterministic: facts come out in header order, then correlation order, then
 * recommendation order, then chart order, so the same profile always produces
 * the same ids in the same positions. The retriever relies on that for its
 * tiebreak.
 *
 * `charts` is separate from `profile` because `recommendCharts` runs beside
 * `profileDataset` rather than inside it, and the hook holds both.
 */
export function buildFactIndex(
  profile: DataProfile,
  charts: readonly ChartSpec[] = [],
): FactIndex {
  const facts: DatasetFact[] = [];
  const rowCount = profile.retainedRowCount;

  facts.push(
    factOf(
      'dataset',
      'dataset',
      [],
      `Dataset shape. Rows profiled: ${num(rowCount)} of ${num(profile.totalRowCount)} in the file. ` +
        `Columns: ${num(profile.columns.length)}. ` +
        `Duplicate rows: ${num(profile.duplicateRowCount)} ` +
        `(${percent(profile.duplicateRowCount, rowCount)}%).`,
    ),
  );

  for (let i = 0; i < profile.columns.length; i += 1) {
    const column = profile.columns[i];
    if (column === undefined || column === null) continue;
    for (const fact of columnFacts(column, i, rowCount)) facts.push(fact);
  }

  for (let i = 0; i < profile.correlations.length; i += 1) {
    const pair = profile.correlations[i];
    if (pair === undefined || pair === null) continue;
    const direction = pair.coefficient >= 0 ? 'positive' : 'negative';
    facts.push(
      factOf(
        `corr:${i}`,
        'correlation',
        [pair.columnA, pair.columnB],
        `Correlation ${pair.columnA} vs ${pair.columnB}. r = ${num(pair.coefficient)} ` +
          `(${direction}). Association only, not cause.`,
      ),
    );
  }

  const quality = profile.quality;
  facts.push(
    factOf(
      'quality',
      'quality',
      [],
      `Data quality score: ${num(quality.score)} of 100. Penalties: ` +
        quality.penalties
          .map((p) => `${p.factor} -${num(p.penalty)} of ${num(p.weight)}`)
          .join(', ') +
        '.',
    ),
  );

  for (let i = 0; i < quality.recommendations.length; i += 1) {
    const rec = quality.recommendations[i];
    if (rec === undefined || rec === null) continue;
    const subject = rec.column ?? 'Whole dataset';
    facts.push(
      factOf(
        `issue:${i}`,
        'issue',
        rec.column === null ? [] : [rec.column],
        `Quality issue in ${subject} (${rec.issue}). ${rec.detail} ${rec.action}`,
      ),
    );
  }

  for (let i = 0; i < charts.length; i += 1) {
    const spec = charts[i];
    if (spec === undefined || spec === null) continue;
    facts.push(chartFact(spec, i));
  }

  return finalize(
    facts.slice(0, MAX_FACTS),
    profile.columns.map((column) => column.name),
  );
}

/** Computes the corpus statistics BM25 needs, once. */
function finalize(facts: DatasetFact[], columnNames: string[]): FactIndex {
  const df = new Map<string, number>();
  let totalLen = 0;

  for (const fact of facts) {
    totalLen += fact.terms.length;
    for (const term of new Set(fact.terms)) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }

  return {
    facts,
    df,
    avgLen: facts.length === 0 ? 0 : totalLen / facts.length,
    columnNames,
  };
}
