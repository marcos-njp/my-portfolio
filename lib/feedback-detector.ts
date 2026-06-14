/**
 * Adaptive Feedback Detector
 * Learns from user preferences while resisting unprofessional requests
 * Patterns sourced from data/rag-config.ts
 */

import { FEEDBACK_PATTERNS, INVALID_REQUEST_PATTERNS } from '@/data/rag-config';

export interface UserFeedback {
  type: 'length' | 'detail' | 'tone' | 'invalid';
  instruction: string;
  isProfessional: boolean;
  timestamp: number;
}

export interface FeedbackPreferences {
  responseLength?: 'shorter' | 'longer' | 'default';
  detailLevel?: 'more_specific' | 'high_level' | 'default';
  tone?: 'more_humble' | 'less_boastful' | 'more_confident' | 'default';
  examples?: number;
  feedback: UserFeedback[];
}

/**
 * Detect if message contains user feedback about response quality
 */
export function detectFeedback(message: string): UserFeedback | null {
  const lowerMessage = message.toLowerCase();
  
  // Check for INVALID patterns first (reject these)
  for (const pattern of INVALID_REQUEST_PATTERNS) {
    if (pattern.test(lowerMessage)) {
      return {
        type: 'invalid',
        instruction: message,
        isProfessional: false,
        timestamp: Date.now(),
      };
    }
  }
  
  // Check for valid LENGTH feedback
  if (FEEDBACK_PATTERNS.length.shorter.test(message)) {
    return {
      type: 'length',
      instruction: 'Keep responses shorter and more concise',
      isProfessional: true,
      timestamp: Date.now(),
    };
  }
  
  if (FEEDBACK_PATTERNS.length.longer.test(message)) {
    return {
      type: 'length',
      instruction: 'Provide more detailed and comprehensive responses',
      isProfessional: true,
      timestamp: Date.now(),
    };
  }
  
  // Check for valid DETAIL feedback
  if (FEEDBACK_PATTERNS.detail.more_specific.test(message)) {
    return {
      type: 'detail',
      instruction: 'Be more specific with examples and concrete details',
      isProfessional: true,
      timestamp: Date.now(),
    };
  }
  
  if (FEEDBACK_PATTERNS.detail.high_level.test(message)) {
    return {
      type: 'detail',
      instruction: 'Provide high-level overview without too many details',
      isProfessional: true,
      timestamp: Date.now(),
    };
  }
  
  // Check for valid TONE feedback
  if (FEEDBACK_PATTERNS.tone.humble.test(message)) {
    return {
      type: 'tone',
      instruction: 'Be more humble and less boastful in responses',
      isProfessional: true,
      timestamp: Date.now(),
    };
  }
  
  if (FEEDBACK_PATTERNS.tone.confident.test(message)) {
    return {
      type: 'tone',
      instruction: 'Be more confident and assertive about achievements',
      isProfessional: true,
      timestamp: Date.now(),
    };
  }
  
  return null; // No feedback detected
}

/**
 * Apply user feedback to preferences
 */
export function applyFeedback(
  currentPreferences: FeedbackPreferences,
  feedback: UserFeedback
): FeedbackPreferences {
  if (!feedback.isProfessional) {
    // Don't apply unprofessional feedback, but track it
    return {
      ...currentPreferences,
      feedback: [...currentPreferences.feedback, feedback],
    };
  }
  
  const newPreferences = { ...currentPreferences };
  
  // Apply valid feedback
  if (feedback.type === 'length') {
    if (feedback.instruction.includes('shorter')) {
      newPreferences.responseLength = 'shorter';
    } else if (feedback.instruction.includes('detailed')) {
      newPreferences.responseLength = 'longer';
    }
  }
  
  if (feedback.type === 'detail') {
    if (feedback.instruction.includes('specific')) {
      newPreferences.detailLevel = 'more_specific';
      newPreferences.examples = 2; // Include 2 concrete examples
    } else if (feedback.instruction.includes('high-level')) {
      newPreferences.detailLevel = 'high_level';
      newPreferences.examples = 0; // No examples
    }
  }
  
  if (feedback.type === 'tone') {
    if (feedback.instruction.includes('humble') || feedback.instruction.includes('boastful')) {
      newPreferences.tone = 'more_humble';
    } else if (feedback.instruction.includes('confident')) {
      newPreferences.tone = 'more_confident';
    }
  }
  
  // Track feedback
  newPreferences.feedback = [...currentPreferences.feedback, feedback].slice(-5); // Keep last 5
  
  return newPreferences;
}

/**
 * Build instruction string from preferences
 * Optimized: Reduced from ~80 tokens to ~30 tokens
 */
export function buildFeedbackInstruction(preferences: FeedbackPreferences): string {
  const instructions: string[] = [];
  
  if (preferences.responseLength === 'shorter') {
    instructions.push('User wants: SHORT (1-2 sentences)');
  } else if (preferences.responseLength === 'longer') {
    instructions.push('User wants: MORE DETAIL');
  }
  
  if (preferences.detailLevel === 'more_specific') {
    instructions.push(`USER PREFERENCE: Be SPECIFIC - include concrete examples, numbers, and details (aim for ${preferences.examples || 2} examples)`);
  } else if (preferences.detailLevel === 'high_level') {
    instructions.push('USER PREFERENCE: High-level overview only - skip granular details');
  }
  
  if (preferences.tone === 'more_humble') {
    instructions.push('USER FEEDBACK: BE MORE HUMBLE - avoid boastful language, use "I learned" not "I mastered", acknowledge growth areas');
  } else if (preferences.tone === 'more_confident') {
    instructions.push('USER FEEDBACK: BE MORE CONFIDENT - highlight achievements clearly, don\'t undersell yourself');
  }
  
  if (instructions.length === 0) return '';
  
  return '\n\nADAPTIVE FEEDBACK (Learn from user\'s preferences):\n' + 
    instructions.join('\n') + 
    '\n(These preferences learned from user feedback in this session)\n';
}

/**
 * Check if request is unprofessional and should be rejected
 */
export function isUnprofessionalRequest(message: string): boolean {
  return INVALID_REQUEST_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Get rejection message for unprofessional requests
 */
export function getUnprofessionalRejection(message: string, mood: string = 'professional'): string {
  if (mood === 'genz') {
    const genzRejections = [
      "Nah bro, that's not the vibe - Ask me about my projects or skills instead fr",
      "Lol that's outta pocket 😭 Let's talk about my portfolio tho - what you wanna know?",
      "Not happening chief 🤌 We keeping this professional. Ask about my work, skills, or projects",
      "Yo that's wild - Stick to asking about my tech stuff, projects, or experience fr fr",
    ];
    return genzRejections[Math.floor(Math.random() * genzRejections.length)];
  }
  
  const rejections = [
    "I'm here to discuss Niño's professional background. Let's keep this professional - what would you like to know about his skills, projects, or experience?",
    "That's not a professional request. I'm happy to answer questions about Niño's technical skills, projects, or career goals. What would you like to know?",
    "I maintain professional standards. Ask me about Niño's development experience, technical expertise, or achievements instead.",
  ];
  
  return rejections[Math.floor(Math.random() * rejections.length)];
}
