/**
 * Response Validator - Ensures AI responses match selected mood
 * Helps identify when LLM doesn't follow personality instructions
 */

import { type AIMood } from './ai-moods';

export interface ValidationResult {
  compliant: boolean;
  reason?: string;
  details?: {
    hasSlang?: boolean;
    hasEmoji?: boolean;
    hasCasualStart?: boolean;
    slangCount?: number;
    emojiCount?: number;
  };
}

/**
 * Validate if response matches the expected mood/personality
 */
export function validateMoodCompliance(
  response: string, 
  mood: AIMood
): ValidationResult {
  
  if (mood === 'genz') {
    const slangTerms = [
      // Common slang
      'no cap', 'fr', 'ngl', 'ong', 'bet', 'facts', 'tbh', 'icl', 'imo', 'istg', 'iykyk',
      // Reactions
      'lmao', 'lol', 'bruh', "ain't that deep", 'deadass',
      // Quality descriptors
      'fire', 'bussin', 'goated', 'hits different', 'ate', 'slay', 'mid', "it's giving", 'based', 'unhinged',
      // Casual phrases
      'finna', 'ion', 'valid', 'rent free', 'main character',
      // Avoid checking for overused ones
    ];
    
    const lowerResponse = response.toLowerCase();
    const slangMatches = slangTerms.filter(term => lowerResponse.includes(term));
    const hasSlang = slangMatches.length > 0;
    const slangCount = slangMatches.length;
    
    // Check for repetitive "lowkey" usage (red flag)
    const lowkeyCount = (lowerResponse.match(/lowkey/g) || []).length;
    const isRepetitive = lowkeyCount > 2;
    
    // Check for emojis using Unicode ranges
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu;
    const emojiMatches = response.match(emojiRegex);
    const hasEmoji = !!(emojiMatches && emojiMatches.length > 0);
    const emojiCount = emojiMatches ? emojiMatches.length : 0;
    
    // Check for casual starters
    const casualStarters = ['yo', 'aight', 'so like', 'okay so', 'real talk', 'ngl', 'bruh'];
    const hasCasualStart = casualStarters.some(starter => 
      lowerResponse.startsWith(starter)
    );
    
    const details = {
      hasSlang,
      hasEmoji,
      hasCasualStart,
      slangCount,
      emojiCount,
    };
    
    // Warn about repetitive usage
    if (isRepetitive) {
      return {
        compliant: false,
        reason: `Overusing "lowkey" (${lowkeyCount} times) - need more variety in slang`,
        details,
      };
    }
    
    // GenZ mode requires at least ONE of: slang OR emojis
    // Ideally both, but we'll be lenient
    if (!hasSlang && !hasEmoji) {
      return { 
        compliant: false, 
        reason: 'Missing GenZ slang and emojis - response too formal',
        details,
      };
    }
    
    // Warn if missing slang (but has emojis)
    if (!hasSlang && hasEmoji) {
      return {
        compliant: true,
        reason: 'Has emojis but missing slang - could be more casual',
        details,
      };
    }
    
    // Warn if missing emojis (but has slang)
    if (hasSlang && !hasEmoji) {
      return {
        compliant: true,
        reason: 'Has slang but missing emojis - could be more expressive',
        details,
      };
    }
    
    return { compliant: true, details };
  }
  
  // Professional mode - just check it's not overly casual
  if (mood === 'professional') {
    const lowerResponse = response.toLowerCase();
    const overlySlangTerms = ['yo', 'ngl', 'fr fr', 'bussin', 'ate', 'deadass'];
    const hasOverlySlang = overlySlangTerms.some(term => lowerResponse.includes(term));
    
    if (hasOverlySlang) {
      return {
        compliant: false,
        reason: 'Response too casual for professional mode',
      };
    }
    
    return { compliant: true };
  }
  
  return { compliant: true };
}

/**
 * Log validation results for monitoring
 */
export function logValidationResult(
  validation: ValidationResult,
  mood: AIMood,
  response: string
): void {
  if (!validation.compliant) {
    console.warn(`[Mood Validation] ❌ Response didn't match ${mood} mode:`, validation.reason);
    if (validation.details) {
      console.warn('[Mood Validation] Details:', validation.details);
    }
  } else if (validation.reason) {
    console.log(`[Mood Validation] ⚠️ ${mood} mode warning:`, validation.reason);
    if (validation.details) {
      console.log('[Mood Validation] Details:', validation.details);
    }
  } else {
    console.log(`[Mood Validation] ✅ Response matches ${mood} mode`);
    if (validation.details) {
      console.log('[Mood Validation] Details:', validation.details);
    }
  }
}

/**
 * Get a score (0-100) for how well response matches mood
 */
export function getMoodComplianceScore(
  response: string,
  mood: AIMood
): number {
  const validation = validateMoodCompliance(response, mood);
  
  if (mood === 'genz' && validation.details) {
    let score = 0;
    
    // Slang contribution (40 points max)
    if (validation.details.hasSlang) {
      score += Math.min(40, (validation.details.slangCount || 0) * 15);
    }
    
    // Emoji contribution (30 points max)
    if (validation.details.hasEmoji) {
      score += Math.min(30, (validation.details.emojiCount || 0) * 10);
    }
    
    // Casual start (30 points)
    if (validation.details.hasCasualStart) {
      score += 30;
    }
    
    return Math.min(100, score);
  }
  
  // For professional mode, just return 100 if compliant
  return validation.compliant ? 100 : 0;
}
