/**
 * Query Preprocessing - normalization and follow-up (coreference) resolution.
 *
 * Typo/fuzzy correction was removed: the embedding model already tolerates
 * misspellings, and the Levenshtein pass rewrote legitimate words.
 */

/**
 * Normalize query text
 */
export function normalizeQuery(query: string): string {
  let normalized = query.trim();
  
  // Remove extra spaces
  normalized = normalized.replace(/\s+/g, ' ');
  
  // Fix common punctuation issues
  normalized = normalized.replace(/\s+([.,!?])/g, '$1');
  normalized = normalized.replace(/([.,!?])([a-zA-Z])/g, '$1 $2');
  
  return normalized;
}

/**
 * Preprocessing pipeline.
 */
export function preprocessQuery(query: string): { original: string; corrected: string; changes: string[] } {
  return { original: query, corrected: normalizeQuery(query), changes: [] };
}

/**
 * Follow-up resolution (coreference).
 *
 * A pronoun-only query like "tell me more about that first one" carries no
 * semantic signal, so embedding it verbatim retrieves noise that can still
 * scrape past the score threshold — and noise labelled as RELEVANT CONTEXT is
 * what makes the model invent details. We therefore retrieve using the recent
 * turns as well, so the vector search sees the subject the query refers to.
 *
 * Deterministic on purpose: no extra LLM round-trip on the hot path.
 */

/** Queries that only make sense relative to what was just said. */
const REFERENCE_PATTERN =
  /\b(?:it|its|that|this|these|those|them|they|the (?:first|second|third|last|other) one)\b|^\s*(?:tell me more|more|elaborate|go on|continue|what else|how so)\b/i;

/** How much of a prior message to carry into the search query. */
const CONTEXT_CHARS = 300;

export interface ResolvedQuery {
  /** Query to embed for vector search. */
  searchQuery: string;
  /** True when prior turns were folded in. */
  resolved: boolean;
}

export function needsContextResolution(query: string): boolean {
  return REFERENCE_PATTERN.test(query.trim());
}

/**
 * Expand a referring query with the previous turns so vector search can find
 * the subject. Returns the query unchanged when it already stands alone.
 */
export function resolveFollowUpQuery(
  query: string,
  history: { role: string; content: string }[]
): ResolvedQuery {
  if (history.length === 0 || !needsContextResolution(query)) {
    return { searchQuery: query, resolved: false };
  }

  // The last assistant turn names the entities ("the first one"); the last user
  // turn supplies the topic. Both help, so include whichever exist.
  const lastUser = [...history].reverse().find(m => m.role === 'user');
  const lastAssistant = [...history].reverse().find(m => m.role === 'assistant');

  const parts = [
    lastUser?.content.slice(0, CONTEXT_CHARS),
    lastAssistant?.content.slice(0, CONTEXT_CHARS),
    query,
  ].filter(Boolean);

  if (parts.length === 1) return { searchQuery: query, resolved: false };

  return { searchQuery: parts.join(' '), resolved: true };
}
