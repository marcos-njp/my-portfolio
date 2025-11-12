/**
 * Response Length Management
 * Smart truncation with follow-up prompts
 */

export interface LengthConstraints {
  maxTokens: number;
  softLimit: number;  // Suggest "ask for more" at this point
  hardLimit: number;  // Cut off at this point
}

export const DEFAULT_CONSTRAINTS: LengthConstraints = {
  maxTokens: 400,     // Groq AI suggested max
  softLimit: 300,     // ~60 words (suggest follow-up)
  hardLimit: 500,     // ~100 words (absolute cut)
};

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Add smart follow-up prompt based on response context
 */
export function addFollowUpPrompt(
  response: string,
  queryContext: string
): string {
  const wordCount = countWords(response);
  
  // If response is already short, no need for follow-up
  if (wordCount < 40) {
    return response;
  }
  
  // Detect what was discussed to suggest relevant follow-ups
  const lowerResponse = response.toLowerCase();
  let followUpSuggestion = '';
  
  if (lowerResponse.includes('project') || lowerResponse.includes('built') || lowerResponse.includes('application')) {
    followUpSuggestion = '\n\n💡 *Ask me for more details about specific projects or technical implementation choices.*';
  } else if (lowerResponse.includes('skill') || lowerResponse.includes('programming') || lowerResponse.includes('language')) {
    followUpSuggestion = '\n\n💡 *Feel free to ask about specific technologies, frameworks, or my proficiency levels.*';
  } else if (lowerResponse.includes('experience') || lowerResponse.includes('work') || lowerResponse.includes('role')) {
    followUpSuggestion = '\n\n💡 *I can elaborate on specific experiences, responsibilities, or achievements.*';
  } else if (lowerResponse.includes('education') || lowerResponse.includes('university') || lowerResponse.includes('degree')) {
    followUpSuggestion = '\n\n💡 *Ask about my coursework, academic achievements, or learning approach.*';
  } else if (lowerResponse.includes('achievement') || lowerResponse.includes('award') || lowerResponse.includes('competition')) {
    followUpSuggestion = '\n\n💡 *I can share more details about specific competitions or recognition.*';
  } else {
    followUpSuggestion = '\n\n💡 *Feel free to ask for more specific details or examples.*';
  }
  
  return response + followUpSuggestion;
}

/**
 * Create concise system instruction for response length
 */
export function getResponseLengthInstruction(constraints: LengthConstraints = DEFAULT_CONSTRAINTS): string {
  return `
RESPONSE LENGTH GUIDELINES:
- Keep responses CONCISE and FOCUSED (aim for 40-60 words)
- For simple questions: 2-3 sentences maximum
- For complex questions: 4-6 sentences, use bullet points if listing multiple items
- If topic requires more detail, provide summary and suggest "ask for specifics"
- NEVER exceed ${Math.floor(constraints.softLimit / 5)} words unless absolutely necessary
- Use numbers, metrics, and specific examples to be informative while staying brief

EXAMPLES:
Q: "What programming languages do you know?"
A: "I'm proficient in JavaScript and TypeScript (Advanced, 2 years each) and Python (Intermediate, 5 years). I use JS/TS primarily for web development with Next.js and React."

Q: "Tell me about your projects"
A: "Key projects: 1) AI-powered portfolio with RAG system (Groq AI + Upstash Vector), 2) Person search app (OAuth, Prisma, PostgreSQL), 3) Modern portfolio (Next.js 15, animations). All deployed on Vercel. Want details on any specific project?"`;
}

/**
 * Analyze if response needs length management
 */
export function shouldManageLength(response: string, constraints: LengthConstraints = DEFAULT_CONSTRAINTS): {
  needsManagement: boolean;
  wordCount: number;
  tokenEstimate: number;
  reason?: string;
} {
  const wordCount = countWords(response);
  const tokenEstimate = estimateTokens(response);
  
  if (tokenEstimate > constraints.hardLimit) {
    return {
      needsManagement: true,
      wordCount,
      tokenEstimate,
      reason: 'Exceeds hard token limit',
    };
  }
  
  if (wordCount > 80) {
    return {
      needsManagement: true,
      wordCount,
      tokenEstimate,
      reason: 'Exceeds ideal word count',
    };
  }
  
  return {
    needsManagement: false,
    wordCount,
    tokenEstimate,
  };
}

/**
 * Truncate response intelligently at sentence boundary
 */
export function truncateAtSentence(text: string, maxWords: number = 60): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let result = '';
  let wordCount = 0;
  
  for (const sentence of sentences) {
    const sentenceWords = countWords(sentence);
    if (wordCount + sentenceWords <= maxWords) {
      result += sentence;
      wordCount += sentenceWords;
    } else {
      break;
    }
  }
  
  // If we truncated, add ellipsis and follow-up
  if (result.length < text.length) {
    result = result.trim();
    if (!result.match(/[.!?]$/)) {
      result += '...';
    }
    result += '\n\n💡 *Ask me to elaborate on any specific aspect.*';
  }
  
  return result || text; // Fallback to original if truncation fails
}
