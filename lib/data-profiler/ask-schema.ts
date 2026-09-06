// lib/data-profiler/ask-schema.ts
//
// The wire contract for `/api/profile-qa`.
//
// --- Why this is not in `insight-schema.ts` ----------------------------------
//
// That module's guarantee is that no free-text field exists anywhere in its
// tree, so the insight endpoint cannot be prompt-injected by construction. That
// sentence is still true and worth keeping true. Adding a `question: z.string()`
// beside `insightPayloadSchema` would falsify it for a reader skimming the file,
// and the two payloads share no field anyway. They are different contracts with
// different threat models, so they get different modules.
//
// --- What crosses the wire ---------------------------------------------------
//
// A question, and the rendered text of the facts `fact-retriever.ts` selected.
// Not the `FactIndex`, not `DatasetFact.terms`, not `DatasetFact.columns`, and
// never the parsed dataset. `terms` and `columns` are retrieval aids that the
// server has no use for, and leaving them out keeps the payload to the smallest
// thing that can answer the question.
//
// `.strict()` at every level. A tampered client cannot widen the contract to
// smuggle a field through, and `safeParse` returns an object rebuilt from the
// schema, so only declared fields can reach the model.

import { z } from 'zod';

import {
  MAX_RETRIEVED_FACTS,
  QUESTION_MAX_LENGTH,
  QUESTION_MIN_LENGTH,
} from './constants';
import { FACT_TEXT_CAP, MAX_FACTS } from './constants';

/** Mirrors `FactKind` in `fact-index.ts`. */
export const factKindSchema = z.enum([
  'dataset',
  'column',
  'distribution',
  'topValues',
  'dateRange',
  'correlation',
  'quality',
  'issue',
  'chart',
]);

export const wireFactSchema = z
  .object({
    id: z.string().min(1).max(64),
    kind: factKindSchema,
    text: z.string().min(1).max(FACT_TEXT_CAP),
  })
  .strict();

export const askRequestSchema = z
  .object({
    question: z.string().min(QUESTION_MIN_LENGTH).max(QUESTION_MAX_LENGTH),
    facts: z.array(wireFactSchema).min(1).max(MAX_RETRIEVED_FACTS),
    /**
     * Corpus size the facts were drawn from. The model is told this so it can
     * say "the profile does not cover that" instead of inventing an answer when
     * the retrieved facts do not contain one.
     */
    totalFacts: z.number().int().nonnegative().max(MAX_FACTS),
    columnCount: z.number().int().nonnegative(),
    rowCount: z.number().int().nonnegative(),
  })
  .strict();

export type WireFact = z.infer<typeof wireFactSchema>;
export type AskRequest = z.infer<typeof askRequestSchema>;
