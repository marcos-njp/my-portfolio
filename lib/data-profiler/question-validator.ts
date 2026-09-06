// lib/data-profiler/question-validator.ts
//
// Normalizes and screens a visitor's question before it reaches the model.
//
// --- Why not `lib/query-validator.ts` ----------------------------------------
//
// That validator exists to keep the digital-twin chat on topic: it scores a
// query against the portfolio's subject matter and rejects anything unrelated
// to it. Pointed at this feature it would be actively wrong, not merely
// redundant - "which column has the most nulls" is unrelated to the portfolio
// by design, and would come back as `errorType: 'unrelated'`. The two endpoints
// screen for different things, so they get different validators.
//
// `/api/profile-insights` documents that it needs no validator at all, because
// it has no free-text field. That reasoning is sound and it does not extend
// here: the whole point of this path is that a visitor types something.
//
// --- What actually defends this endpoint --------------------------------------
//
// Not the marker list below. Deny lists are guesses about phrasing, and any
// list short enough to maintain is short enough to work around. The real
// defences are structural, and they live in the route:
//
//   1. The question is passed as a `user` message. It is never concatenated
//      into `system`, so it cannot rewrite the instruction it is answering to.
//   2. The retrieved facts sit inside explicit `=== CONTEXT ===` markers and the
//      system prompt states that everything between them is data.
//   3. The model has no tools, no retrieval of its own and no rows. The worst a
//      successful injection achieves is a wrong answer about a CSV the visitor
//      already has open.
//
// The markers are cheap insurance against the laziest attempts and a clear
// signal in the logs, nothing more. They are not what makes this safe.

import { QUESTION_MAX_LENGTH, QUESTION_MIN_LENGTH } from './constants';

export type QuestionRejection =
  | 'empty'
  | 'too_short'
  | 'too_long'
  | 'control_chars'
  | 'injection';

export interface QuestionCheck {
  ok: boolean;
  /** Normalized text. Safe to send when `ok`; meaningless otherwise. */
  cleaned: string;
  reason?: QuestionRejection;
}

/**
 * Characters that carry no meaning in a typed question but can hide text from a
 * human reviewer: C0 and C1 controls, and the zero-width family.
 *
 * Tab, newline and carriage return are deliberately excluded. They are C0
 * controls, but they are also what a textarea produces when someone presses
 * Enter, and rejecting a two-line question as "characters that cannot be sent"
 * would be nonsense. The whitespace collapse below folds them into spaces.
 */
const CONTROL_OR_INVISIBLE =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200D\u2060\uFEFF]/;

/** Laziest injection attempts. See the header: these are insurance, not defence. */
const INJECTION_MARKERS: readonly RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)/i,
  /disregard\s+(all\s+)?(previous|prior|the)\s+/i,
  /system\s+prompt/i,
  /\byou\s+are\s+now\b/i,
  /\bact\s+as\s+(if|a|an)\b/i,
  /reveal\s+(your|the)\s+(instruction|prompt|system)/i,
  /begin\s+system/i,
  /###\s*system/i,
  /<\|/,
];

/**
 * Normalizes, then screens.
 *
 * NFKC first, so a lookalike written with fullwidth or mathematical letters
 * folds to the ASCII the markers below are written against. Doing it the other
 * way round would let a normalization step reintroduce a marker after the check.
 */
export function validateQuestion(raw: unknown): QuestionCheck {
  if (typeof raw !== 'string') return { ok: false, cleaned: '', reason: 'empty' };

  const normalized = raw.normalize('NFKC');

  if (CONTROL_OR_INVISIBLE.test(normalized)) {
    return { ok: false, cleaned: '', reason: 'control_chars' };
  }

  const cleaned = normalized.replace(/\s+/g, ' ').trim();

  if (cleaned.length === 0) return { ok: false, cleaned, reason: 'empty' };
  if (cleaned.length < QUESTION_MIN_LENGTH) {
    return { ok: false, cleaned, reason: 'too_short' };
  }
  if (cleaned.length > QUESTION_MAX_LENGTH) {
    return { ok: false, cleaned, reason: 'too_long' };
  }

  for (const marker of INJECTION_MARKERS) {
    if (marker.test(cleaned)) return { ok: false, cleaned, reason: 'injection' };
  }

  return { ok: true, cleaned };
}

/** The sentence shown to the visitor for each rejection. */
export function describeRejection(reason: QuestionRejection): string {
  switch (reason) {
    case 'empty':
      return 'Type a question about the profile first.';
    case 'too_short':
      return `Questions need at least ${QUESTION_MIN_LENGTH} characters.`;
    case 'too_long':
      return `Questions are limited to ${QUESTION_MAX_LENGTH} characters.`;
    case 'control_chars':
      return 'That question contains characters that cannot be sent. Retype it as plain text.';
    case 'injection':
      return 'That question looks like an attempt to change the assistant instructions. Ask about the profile instead.';
  }
}
