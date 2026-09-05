/**
 * Query Validation - Professional Context Detection
 * Patterns sourced from data/rag-config.ts
 */

import {
  PROFESSIONAL_PATTERNS,
  REJECTION_PATTERNS,
  KNOWLEDGE_GAP_PATTERNS,
  SUGGESTED_QUESTION_PATTERNS,
  GREETING_PATTERN,
} from '@/data/rag-config';

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  category?: string;
  confidence: number;
  errorType?: 'unrelated' | 'manipulation' | 'too_short' | 'tech_preferences' | 'entertainment' | 'personal' | 'inappropriate' | 'knowledge_gap';
  specificType?: string;
}

/**
 * SEMANTIC: Validate if query is professionally relevant
 * Uses pattern matching instead of exhaustive keyword lists
 */
export function validateQuery(query: string): ValidationResult {
  const queryLower = query.toLowerCase().trim();
  
  // Empty query check
  if (!queryLower || queryLower.length < 2) {
    return {
      isValid: false,
      reason: "Query too short", // Generic reason for fallback
      errorType: 'too_short',
      confidence: 1.0
    };
  }
  
  // Whitelist for suggested questions - always allow these
  if (SUGGESTED_QUESTION_PATTERNS.some(pattern => pattern.test(queryLower))) {
    return {
      isValid: true,
      category: 'suggested_question',
      confidence: 1.0
    };
  }
  
  // Greetings are always valid
  if (GREETING_PATTERN.test(queryLower)) {
    return {
      isValid: true,
      category: 'greeting',
      confidence: 1.0
    };
  }
  
  // Check for manipulation attempts FIRST (highest priority rejection)
  if (REJECTION_PATTERNS.manipulation.test(queryLower)) {
    return {
      isValid: false,
      reason: "Manipulation attempt detected", // Generic reason for fallback
      errorType: 'manipulation',
      confidence: 0.98
    };
  }
  
  // Check for inappropriate/irrelevant content with specific categorization
  for (const [type, pattern] of Object.entries(REJECTION_PATTERNS)) {
    if (type !== 'manipulation' && pattern.test(queryLower)) {
      // Map specific rejection types to error types
      let errorType: ValidationResult['errorType'] = 'unrelated';
      if (type === 'tech_preferences') errorType = 'tech_preferences';
      else if (type === 'entertainment') errorType = 'entertainment';
      else if (type === 'personal') errorType = 'personal';
      else if (type === 'inappropriate') errorType = 'inappropriate';
      
      return {
        isValid: false,
        reason: "Unrelated topic detected", // Generic reason for fallback
        errorType,
        specificType: type,
        confidence: 0.95
      };
    }
  }
  
  // Enhanced: Detect knowledge gaps
  for (const { pattern, type } of KNOWLEDGE_GAP_PATTERNS) {
    if (pattern.test(queryLower)) {
      return {
        isValid: false,
        category: 'knowledge_gap',
        errorType: 'knowledge_gap',
        specificType: type,
        confidence: 0.85
      };
    }
  }
  
  // Calculate professional relevance using semantic patterns
  let professionalScore = 0;
  const matchedCategories: string[] = [];
  
  for (const [category, pattern] of Object.entries(PROFESSIONAL_PATTERNS)) {
    if (pattern.test(queryLower)) {
      professionalScore++;
      matchedCategories.push(category);
    }
  }
  
  // Determine category from matched patterns
  let category = 'general';
  if (matchedCategories.includes('technical') || matchedCategories.includes('skills')) {
    category = 'technical_skills';
  } else if (matchedCategories.includes('projects')) {
    category = 'projects';
  } else if (matchedCategories.includes('education')) {
    category = 'education';
  } else if (matchedCategories.includes('career')) {
    category = 'experience';
  }
  
  // Calculate confidence based on professional pattern matches
  let confidence = 0.5;
  if (professionalScore >= 3) confidence = 0.95;
  else if (professionalScore >= 2) confidence = 0.85;
  else if (professionalScore >= 1) confidence = 0.75;
  else if (matchedCategories.includes('questions') || matchedCategories.includes('inquiry')) confidence = 0.65;
  
  // Accept if professional relevance detected
  if (confidence >= 0.65) {
    return {
      isValid: true,
      category,
      confidence
    };
  }
  
  // Reject with helpful message
  return {
    isValid: false,
    reason: "Not professionally relevant", // Generic reason for fallback
    errorType: 'unrelated',
    confidence: 0.8
  };
}
