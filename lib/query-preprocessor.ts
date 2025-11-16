/**
 * Query Preprocessing - Simplified typo correction
 * Handles common typos only, removed complex fuzzy matching
 */

// Common typo mappings (reduced set)
const TYPO_CORRECTIONS: Record<string, string> = {
  // Common misspellings
  'wat': 'what',
  'wut': 'what',
  'wht': 'what',
  'cna': 'can',
  'tel': 'tell',
  'abotu': 'about',
  'abot': 'about',
  'youself': 'yourself',
  'yur': 'your',
  'yor': 'your',
  'teh': 'the',
  'hte': 'the',
  'taht': 'that',
  'wich': 'which',
};

// Common phrase corrections
const PHRASE_CORRECTIONS: Record<string, string> = {
  'tell me abot': 'tell me about',
  'wat can you': 'what can you',
  'wat do you': 'what do you',
  'can u': 'can you',
  'tel me': 'tell me',
  'ur skills': 'your skills',
  'ur experience': 'your experience',
  'do u have': 'do you have',
};

/**
 * Fix common typos in a query
 */
export function fixTypos(query: string): string {
  let corrected = query.toLowerCase();
  
  // First, fix common phrases
  for (const [typo, correction] of Object.entries(PHRASE_CORRECTIONS)) {
    const regex = new RegExp(`\\b${typo}\\b`, 'gi');
    corrected = corrected.replace(regex, correction);
  }
  
  // Then, fix individual words
  const words = corrected.split(/\s+/);
  const fixedWords = words.map(word => {
    const cleanWord = word.replace(/[.,!?;:]$/, '');
    const punctuation = word.slice(cleanWord.length);
    
    if (TYPO_CORRECTIONS[cleanWord]) {
      return TYPO_CORRECTIONS[cleanWord] + punctuation;
    }
    return word;
  });
  
  return fixedWords.join(' ');
}

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
 * Simplified preprocessing pipeline (typo fixes only)
 */
export function preprocessQuery(query: string): { original: string; corrected: string; changes: string[] } {
  const original = query;
  const changes: string[] = [];
  
  // Step 1: Normalize
  let processed = normalizeQuery(query);
  
  // Step 2: Fix known typos
  const afterTypoFix = fixTypos(processed);
  if (afterTypoFix !== processed) {
    changes.push('Fixed common typos');
    processed = afterTypoFix;
  }
  
  return {
    original,
    corrected: processed,
    changes,
  };
}
