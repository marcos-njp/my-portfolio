// lib/data-profiler/fact-retriever.ts
//
// Ranks the facts in a `FactIndex` against a question and returns the handful
// worth sending.
//
// --- Why lexical retrieval, in the browser -----------------------------------
//
// The obvious alternative is the Upstash Vector index this site already uses for
// the digital-twin chat. It was rejected for three reasons, in descending order
// of seriousness:
//
//   1. It is one shared index. `app/api/chat/route.ts` queries the default
//      namespace at `minScore: 0.6`, so a visitor's column names, upserted for
//      their own session, become retrievable context in somebody else's chat.
//   2. Upserting during profiling is a network request, and
//      `no-transmission.test.ts` asserts profiling issues none at all. That
//      guarantee is the feature's main claim, not an implementation detail.
//   3. Upstash Vector has no per-vector TTL, so every abandoned dataset would
//      need a sweeper to clean up after it.
//
// The win Vector would buy is recall on paraphrase. This corpus is a few hundred
// short statements over column names plus a closed vocabulary of about thirty
// statistical terms, which the synonym table below covers directly. Trading a
// leak class for paraphrase recall on a thirty-word vocabulary is not a trade
// worth making.
//
// Pure and deterministic, like the rest of `lib/data-profiler/`.

import {
  MAX_FACT_CONTEXT_CHARS,
  MAX_RETRIEVED_FACTS,
} from './constants';
import type { DatasetFact, FactIndex, FactKind } from './fact-index';
import { tokenize } from './fact-index';

export { tokenize };

/** Okapi BM25 term-frequency saturation. The standard default. */
const K1 = 1.2;

/** Okapi BM25 length normalisation. The standard default. */
const B = 0.75;

/** Applied to facts about a column the question named outright. */
const COLUMN_NAME_BOOST = 2.5;

/** Applied to facts whose kind the question asked for by synonym. */
const KIND_BOOST = 1.8;

/**
 * Added, not multiplied, when the synonym table asks for a kind.
 *
 * A multiplicative boost alone cannot recall anything: a fact that shares no
 * term with the question scores zero, and zero times any factor is still zero,
 * so the synonym table would only ever reorder facts that already matched
 * lexically. That defeats its purpose. "Is anything related to anything else"
 * shares no term with `Correlation amount vs quantity`, and reaching that fact
 * anyway is exactly the paraphrase gap embeddings would otherwise be needed for.
 *
 * Set below the score a genuine multi-term match earns, so an explicit question
 * still outranks a fact recalled purely by kind.
 */
const KIND_FLOOR = 0.5;

/**
 * Question vocabulary mapped onto the kinds that answer it.
 *
 * This is the part that substitutes for embeddings. Someone asking "which field
 * is patchiest" shares no term with "Missing: 44 of 452 rows", so lexical
 * overlap alone would rank that fact at zero; mapping `patchy` onto the kinds
 * that carry null counts recovers it. Keys are matched as whole tokens after the
 * same `tokenize` the index used.
 */
const SYNONYMS: ReadonlyArray<{ terms: readonly string[]; kinds: readonly FactKind[] }> = [
  {
    terms: ['missing', 'null', 'nulls', 'empty', 'blank', 'blanks', 'incomplete', 'patchy', 'gaps'],
    kinds: ['column', 'issue', 'quality'],
  },
  {
    terms: ['average', 'mean', 'median', 'typical', 'centre', 'center'],
    kinds: ['distribution'],
  },
  {
    terms: ['spread', 'deviation', 'variance', 'sd', 'stddev', 'range', 'quartile', 'iqr'],
    kinds: ['distribution'],
  },
  {
    terms: ['outlier', 'outliers', 'anomaly', 'anomalies', 'extreme', 'extremes'],
    kinds: ['distribution', 'issue'],
  },
  {
    terms: ['dupe', 'dupes', 'duplicate', 'duplicates', 'repeated', 'repeat'],
    kinds: ['dataset', 'issue'],
  },
  {
    terms: ['correlation', 'correlations', 'correlated', 'relationship', 'related', 'associated', 'association'],
    kinds: ['correlation'],
  },
  {
    terms: ['skew', 'skewed', 'distribution', 'shape', 'histogram', 'spread'],
    kinds: ['distribution', 'chart'],
  },
  {
    terms: ['date', 'dates', 'time', 'period', 'earliest', 'latest', 'oldest', 'newest', 'span'],
    kinds: ['dateRange'],
  },
  {
    terms: ['common', 'frequent', 'top', 'mode', 'popular', 'category', 'categories'],
    kinds: ['topValues'],
  },
  {
    terms: ['quality', 'score', 'clean', 'cleaning', 'fix', 'issues', 'problems'],
    kinds: ['quality', 'issue'],
  },
  {
    terms: ['chart', 'charts', 'plot', 'graph', 'visual', 'visualise', 'visualize'],
    kinds: ['chart'],
  },
  {
    terms: ['rows', 'row', 'size', 'shape', 'columns', 'column', 'wide', 'big'],
    kinds: ['dataset'],
  },
];

export interface RetrievedFacts {
  /** Ranked, then cut to the fact count and character budgets. */
  facts: DatasetFact[];
  /** Parallel to `facts`. Exposed so the UI can show why something surfaced. */
  scores: number[];
  /** Column names the question named outright, in index order. */
  matchedColumns: string[];
  /** Size of the corpus these were drawn from, for the provenance line. */
  totalFacts: number;
}

/** Inverse document frequency, the BM25 variant, floored at zero. */
function idf(df: number, total: number): number {
  return Math.max(0, Math.log(1 + (total - df + 0.5) / (df + 0.5)));
}

/**
 * The columns a question names outright.
 *
 * Matched on the tokenized name so `signup_date` is found by "signup date", and
 * requiring every part to be present so a column called `id` is not matched by
 * every question containing the word.
 */
function namedColumns(questionTerms: Set<string>, columnNames: string[]): string[] {
  const out: string[] = [];
  for (const name of columnNames) {
    const parts = tokenize(name);
    if (parts.length === 0) continue;
    if (parts.every((part) => questionTerms.has(part))) out.push(name);
  }
  return out;
}

/** The kinds a question asked for by synonym. */
function requestedKinds(questionTerms: Set<string>): Set<FactKind> {
  const kinds = new Set<FactKind>();
  for (const entry of SYNONYMS) {
    if (entry.terms.some((term) => questionTerms.has(term))) {
      for (const kind of entry.kinds) kinds.add(kind);
    }
  }
  return kinds;
}

/**
 * Ranks and truncates.
 *
 * The `dataset` and `quality` facts are always included, whatever they scored.
 * They are two slots out of twelve and they are what lets the model say "44 of
 * 452 rows" instead of "44 rows": without the row count in context, every
 * proportion in the answer is a guess.
 */
export function retrieveFacts(index: FactIndex, question: string): RetrievedFacts {
  const total = index.facts.length;
  if (total === 0) {
    return { facts: [], scores: [], matchedColumns: [], totalFacts: 0 };
  }

  const questionTerms = tokenize(question);
  const termSet = new Set(questionTerms);
  const matchedColumns = namedColumns(termSet, index.columnNames);
  const matchedColumnSet = new Set(matchedColumns);
  const kinds = requestedKinds(termSet);

  const scored = index.facts.map((fact) => {
    // Term frequency within this fact, counted once per fact.
    const tf = new Map<string, number>();
    for (const term of fact.terms) tf.set(term, (tf.get(term) ?? 0) + 1);

    const norm =
      index.avgLen === 0 ? 1 : 1 - B + B * (fact.terms.length / index.avgLen);

    let score = 0;
    for (const term of termSet) {
      const freq = tf.get(term);
      if (freq === undefined) continue;
      score += idf(index.df.get(term) ?? 0, total) * ((freq * (K1 + 1)) / (freq + K1 * norm));
    }

    if (fact.columns.some((name) => matchedColumnSet.has(name))) score *= COLUMN_NAME_BOOST;
    if (kinds.has(fact.kind)) score = score * KIND_BOOST + KIND_FLOOR;

    return { fact, score };
  });

  // Descending score, then by id so equal scores order deterministically.
  scored.sort((a, b) => (b.score - a.score) || (a.fact.id < b.fact.id ? -1 : 1));

  const chosen: DatasetFact[] = [];
  const scores: number[] = [];
  const seen = new Set<string>();
  let chars = 0;

  const take = (fact: DatasetFact, score: number): boolean => {
    if (seen.has(fact.id)) return true;
    if (chosen.length >= MAX_RETRIEVED_FACTS) return false;
    if (chars + fact.text.length > MAX_FACT_CONTEXT_CHARS && chosen.length > 0) return false;
    seen.add(fact.id);
    chosen.push(fact);
    scores.push(score);
    chars += fact.text.length;
    return true;
  };

  // The two grounding facts first, so a long tail of high scorers cannot crowd
  // them out of the budget.
  for (const id of ['dataset', 'quality']) {
    const entry = scored.find((candidate) => candidate.fact.id === id);
    if (entry !== undefined) take(entry.fact, entry.score);
  }

  for (const entry of scored) {
    if (entry.score <= 0) continue;
    if (!take(entry.fact, entry.score)) break;
  }

  return { facts: chosen, scores, matchedColumns, totalFacts: total };
}
