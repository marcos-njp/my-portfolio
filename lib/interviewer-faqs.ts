/**
 * FAQ Pattern Matching - Context Hints for Common Questions
 * Patterns sourced from data/rag-config.ts
 */

import { FAQ_PATTERNS, type FAQPattern } from '@/data/rag-config';

/**
 * OPTIMIZED: Find relevant FAQ patterns for query
 * Returns context hints to guide RAG, not hardcoded responses
 */
export function findRelevantFAQPatterns(query: string, topK = 2): FAQPattern[] {
  const lowerQuery = query.toLowerCase();

  const scored = FAQ_PATTERNS.map((pattern) => {
    let score = 0;

    // Keyword matching (primary)
    const keywordMatches = pattern.keywords.filter((keyword) =>
      lowerQuery.includes(keyword.toLowerCase())
    ).length;
    
    score += keywordMatches * 0.4;

    // Word overlap (secondary)
    const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 2);
    const questionWords = pattern.question.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const overlap = queryWords.filter((word) => questionWords.includes(word)).length;
    
    score += overlap * 0.2;

    // Apply boost
    score *= pattern.relevance_boost;

    return { pattern, score };
  });

  // Return top matching patterns (minimum threshold: 0.25)
  return scored
    .filter(({ score }) => score > 0.25)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ pattern }) => pattern);
}

/**
 * Build context hints string for system prompt
 * Optimized: Reduced from ~40 tokens to ~15 tokens
 */
export function buildContextHints(patterns: FAQPattern[]): string {
  if (patterns.length === 0) return '';
  
  let hints = '\n\nCONTEXT FOCUS AREAS:\n';
  patterns.forEach((pattern, idx) => {
    hints += `${idx + 1}. ${pattern.contextHint} (Category: ${pattern.category})\n`;
  });
  
  return hints;
}
