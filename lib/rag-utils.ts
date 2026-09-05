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
  /** True when the vector store itself was unreachable (not merely a weak match). */
  retrievalFailed?: boolean;
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
    minScore = 0.6,
    includeMetadata = true,
  } = options;

  try {
    // The index has a hosted embedding model, so Upstash embeds `data` for us.
    const results = await vectorIndex.query({
      data: query,
      topK,
      includeMetadata,
    }) as VectorResult[];

    if (!results || results.length === 0) return EMPTY_CONTEXT;

    return buildRAGContext(results.filter(r => r.score >= minScore));
  } catch (error) {
    console.error('Vector search error:', error);
    return { ...EMPTY_CONTEXT, retrievalFailed: true };
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
