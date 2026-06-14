/**
 * RAG (Retrieval-Augmented Generation) Utilities
 * Vector search, context building, and relevance validation
 */

import { Index } from '@upstash/vector';

export interface VectorResult {
  id: string;
  score: number;
  metadata?: {
    title?: string;
    content?: string;
    category?: string;
    [key: string]: unknown;
  };
}

export interface RAGContext {
  relevantChunks: string[];
  averageScore: number;
  topScore: number;
  chunksUsed: number;
  categories: string[];
}

const EMPTY_CONTEXT: RAGContext = {
  relevantChunks: [],
  averageScore: 0,
  topScore: 0,
  chunksUsed: 0,
  categories: [],
};

/**
 * Build RAGContext from a set of filtered results
 */
function buildRAGContext(results: VectorResult[]): RAGContext {
  if (results.length === 0) return EMPTY_CONTEXT;

  const scores = results.map(r => r.score);
  return {
    relevantChunks: results.map(r => formatChunk(r.metadata || {}, r.score)),
    averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
    topScore: Math.max(...scores),
    chunksUsed: results.length,
    categories: [...new Set(results.map(r => r.metadata?.category).filter(Boolean) as string[])],
  };
}

/**
 * Vector search with tiered relevance filtering
 */
export async function searchVectorContext(
  vectorIndex: Index,
  query: string,
  options: {
    topK?: number;
    minScore?: number;
    includeMetadata?: boolean;
  } = {}
): Promise<RAGContext> {
  const {
    topK = 5,
    minScore = 0.75,
    includeMetadata = true,
  } = options;

  try {
    const results = await vectorIndex.query({
      data: query,
      topK,
      includeMetadata,
    }) as VectorResult[];

    if (!results || results.length === 0) return EMPTY_CONTEXT;

    // Tier 1: Results meeting primary threshold
    const primaryResults = results.filter(r => r.score >= minScore);
    if (primaryResults.length > 0) return buildRAGContext(primaryResults);

    // Tier 2: Fallback to top 2 results if reasonably good (>0.65)
    const fallbackResults = results.slice(0, 2).filter(r => r.score >= 0.65);
    return buildRAGContext(fallbackResults);
  } catch (error) {
    console.error('Vector search error:', error);
    return EMPTY_CONTEXT;
  }
}

/**
 * Format a chunk with metadata for context injection
 */
function formatChunk(metadata: Record<string, unknown>, score?: number): string {
  const title = metadata.title || 'Information';
  const content = metadata.content || '';
  const category = metadata.category || '';
  
  let formatted = `[${title}]`;
  if (category) {
    formatted += ` (${category})`;
  }
  if (score !== undefined) {
    formatted += ` [Relevance: ${(score * 100).toFixed(1)}%]`;
  }
  formatted += `\n${content}`;
  
  return formatted;
}

/**
 * Build context string for AI prompt
 */
export function buildContextPrompt(ragContext: RAGContext): string {
  if (ragContext.chunksUsed === 0) {
    return '';
  }

  const contextHeader = `\n\n=== RELEVANT CONTEXT (${ragContext.chunksUsed} chunks, avg relevance: ${(ragContext.averageScore * 100).toFixed(1)}%) ===\n`;
  const contextBody = ragContext.relevantChunks.join('\n\n---\n\n');
  const contextFooter = `\n=== END CONTEXT ===\n\nUSE THIS CONTEXT to provide accurate, specific answers. Reference details from the context when relevant.`;

  return contextHeader + contextBody + contextFooter;
}

/**
 * Validate if retrieved context actually answers the specific question
 */
export function validateContextRelevance(query: string, retrievedContext: string, ragScore: number): {
  isRelevant: boolean;
  reason: string;
  confidence: number;
} {
  // If RAG score is too low, definitely not relevant
  if (ragScore < 0.6) {
    return {
      isRelevant: false,
      reason: 'Low semantic similarity score',
      confidence: 0.9
    };
  }
  
  // Check for timeline questions - need time indicators
  if (/how long|timeline|duration|time frame|hours|days|weeks|months/.test(query.toLowerCase())) {
    const hasTimeInfo = /\b(?:\d+\s*(?:hours?|days?|weeks?|months?|years?)|took|spent|duration|timeline)\b/i.test(retrievedContext);
    if (!hasTimeInfo) {
      return {
        isRelevant: false,
        reason: 'Context lacks timeline information for timeline question',
        confidence: 0.8
      };
    }
  }
  
  // Check for metrics questions - need numbers
  if (/how many|users|downloads|visits|metrics|stats|numbers/.test(query.toLowerCase())) {
    const hasMetrics = /\b(?:\d+\s*(?:users?|visits?|downloads?|%|percent|million|thousand)|traffic|revenue|conversion)\b/i.test(retrievedContext);
    if (!hasMetrics) {
      return {
        isRelevant: false,
        reason: 'Context lacks metrics for metrics question',
        confidence: 0.8
      };
    }
  }
  
  // Context seems relevant
  return {
    isRelevant: true,
    reason: 'Context appears to address the query',
    confidence: Math.min(ragScore, 0.85)
  };
}
