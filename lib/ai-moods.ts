/**
 * AI Mood/Personality Configurations
 * 
 * Assembles system prompts from data-driven templates (data/prompt-templates.ts)
 * and personality traits (data/personality.json).
 */

import personality from "@/data/personality.json";
import {
  errorResponses,
  genzSlang,
  genzPatterns,
  genzRules,
  professionalRules,
  type ErrorType,
} from "@/data/prompt-templates";


export type AIMood = 'professional' | 'genz';

export interface MoodConfig {
  id: AIMood;
  name: string;
  icon: string;
  description: string;
  systemPromptAddition: string;
  temperature: number;
}

/**
 * Build GenZ personality vibe string from personality.json
 */
function buildGenZPersonalityContext(): string {
  return `
PERSONALITY VIBES:
- Communication: ${personality.communication_style.casual}
- Traits: ${personality.core_traits.slice(0, 3).join(', ')} (but make it fun)
- What makes me unique: ${personality.what_makes_me_unique[0]}
`;
}

/**
 * Assemble the professional system prompt — concise, driven by personality.json.
 */
function buildProfessionalPrompt(): string {
  const { tone, avoid, badExamples } = professionalRules;
  const examples = badExamples.map((ex) => `Avoid "${ex.bad}"; prefer "${ex.good}".`).join(' ');

  return `PROFESSIONAL VOICE (you are Niño, talking to a recruiter)
Tone: ${tone}
You are: ${personality.core_traits.slice(0, 4).join(', ')}.
Principles: ${personality.communication_principles.join('; ')}.
${examples}
Avoid: ${avoid.join(', ')}. Keep it short and specific, never padded.`;
}

/**
 * Assemble GenZ system prompt from data-driven rules + slang vocabulary
 */
function buildGenZPrompt(): string {
  const { vibeCheck, doList, dontList } = genzRules;

  return `GENZ MODE - Chill Tech Friend

YOU ARE: Texting a friend about Niño's tech journey. Casual, fun, and real.

VIBE CHECK:
${vibeCheck.map((v) => `- ${v}`).join('\n')}

SLANG YOU SHOULD USE (pick 2-4 per response):
**Use often:** ${genzSlang.useOften.join(', ')}
**Use sometimes:** ${genzSlang.useSometimes.join(', ')}
**Spicy tier:** ${genzSlang.spicyTier.join(', ')}

WRITING PATTERNS - USE THESE:
${genzPatterns.map((p) => `- ${p}`).join('\n')}

ADD HUMOR:
- Use skull/ironic expression for funny/ironic moments
- Use "lol" when being self-aware
- Use "😭" for relatable struggles
- Use "😅" for admitting weaknesses
- Light self-deprecating humor is GOOD

DO THIS:
${doList.map((d) => `- ${d}`).join('\n')}

DON'T:
${dontList.map((d) => `- ${d}`).join('\n')}

${buildGenZPersonalityContext()}`;
}

export const AI_MOODS: Record<AIMood, MoodConfig> = {
  professional: {
    id: 'professional',
    name: 'Professional',
    icon: 'BRIEFCASE',
    description: 'Interview-ready, clear and kind',
    systemPromptAddition: buildProfessionalPrompt(),
    temperature: 0.7,
  },
  genz: {
    id: 'genz',
    name: 'GenZ',
    icon: 'FIRE',
    description: 'Casual, like texting a friend',
    systemPromptAddition: buildGenZPrompt(),
    temperature: 0.9,
  },
};

export function getMoodConfig(mood: AIMood = 'professional'): MoodConfig {
  return AI_MOODS[mood] || AI_MOODS.professional;
}

export function getAllMoods(): MoodConfig[] {
  return Object.values(AI_MOODS);
}

/**
 * Get persona-aware error responses based on mood
 */
export function getPersonaResponse(type: ErrorType, mood: AIMood): string {
  return errorResponses[type][mood];
}

/**
 * Smart fallback for insufficient context
 */
export function getSmartFallbackResponse(query: string, mood: AIMood): string {
  if (/how long|timeline|duration|how many|users|downloads|metrics|salary|income/.test(query.toLowerCase())) {
    return getPersonaResponse('knowledge_gap', mood);
  }
  return getPersonaResponse('no_context', mood);
}
