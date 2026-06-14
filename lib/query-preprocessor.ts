/**
 * Query Preprocessing - Typo Detection & Text Normalization
 * Patterns sourced from data/rag-config.ts
 */

import { COMMON_TYPOS, TEXT_SPEAK_PATTERNS, KEY_TERMS } from '@/data/rag-config';

/**
 * Smart typo correction using patterns and common fixes
 */
export function fixTypos(query: string): string {
  let corrected = query.toLowerCase();
  
  // Apply text speak patterns
  for (const { pattern, replace } of TEXT_SPEAK_PATTERNS) {
    corrected = corrected.replace(pattern, replace);
  }
  
  // Fix common individual words
  const words = corrected.split(/\s+/);
  const fixedWords = words.map(word => {
    const cleanWord = word.replace(/[.,!?;:]$/, '');
    const punctuation = word.slice(cleanWord.length);
    
    return (COMMON_TYPOS[cleanWord] || cleanWord) + punctuation;
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
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Smart correction for key professional terms using fuzzy matching
 */
export function correctKeyTerms(query: string): string {
  // Focus on most commonly misspelled professional terms
  const words = query.split(/\s+/);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase().replace(/[.,!?;:]$/, '');
    
    // Skip if word is too short or already correct
    if (word.length < 4 || KEY_TERMS.includes(word)) continue;
    
    // Find best match using Levenshtein distance
    let bestMatch = word;
    let minDistance = Math.floor(word.length * 0.4);
    
    for (const term of KEY_TERMS) {
      const distance = levenshteinDistance(word, term);
      if (distance < minDistance && distance <= 3) { // Max 3 character changes
        minDistance = distance;
        bestMatch = term;
      }
    }
    
    if (bestMatch !== word) {
      const punctuation = words[i].slice(word.length);
      words[i] = bestMatch + punctuation;
    }
  }
  
  return words.join(' ');
}

/**
 * OPTIMIZED preprocessing pipeline
 */
export function preprocessQuery(query: string): { original: string; corrected: string; changes: string[] } {
  const original = query;
  const changes: string[] = [];
  
  // Step 1: Normalize
  let processed = normalizeQuery(query);
  
  // Step 2: Fix known typos (dictionary)
  const afterTypoFix = fixTypos(processed);
  if (afterTypoFix !== processed) {
    changes.push('Fixed common typos');
    processed = afterTypoFix;
  }
  
  // Step 3: Correct key professional terms
  const afterTermCorrection = correctKeyTerms(processed);
  if (afterTermCorrection !== processed) {
    changes.push('Corrected professional terminology');
    processed = afterTermCorrection;
  }
  
  return {
    original,
    corrected: processed,
    changes,
  };
}
