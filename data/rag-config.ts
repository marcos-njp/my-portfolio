/**
 * Central RAG Configuration
 *
 * Single source of truth for all patterns, thresholds, and dictionaries
 * used across lib/ utilities. Edit HERE, not in lib files.
 */

// ─── Typo Corrections ───────────────────────────────────────────────
export const COMMON_TYPOS: Record<string, string> = {
  // Question words
  wat: 'what', wut: 'what', hw: 'how', wy: 'why',
  // Text speak
  ur: 'your', u: 'you', r: 'are', n: 'and',
  // Professional terms
  experiance: 'experience', skilss: 'skills', projets: 'projects',
  programing: 'programming', developement: 'development', educaton: 'education',
  abotu: 'about', teh: 'the', taht: 'that', wich: 'which',
};

export const TEXT_SPEAK_PATTERNS = [
  { pattern: /\b(can|could|do|are|were|did)\s+u\b/gi, replace: '$1 you' },
  { pattern: /\bur\s+(skills|experience|background|projects)/gi, replace: 'your $1' },
  { pattern: /\b(wat|wut)\s+(can|do|are|is)/gi, replace: 'what $2' },
  { pattern: /\bhw\s+(many|much)/gi, replace: 'how $1' },
  { pattern: /\br\s+u\b/gi, replace: 'are you' },
];

/** Professional terms for fuzzy Levenshtein correction */
export const KEY_TERMS = [
  'programming', 'experience', 'development', 'projects',
  'skills', 'technical', 'education', 'university',
];

// ─── Validation Patterns ─────────────────────────────────────────────

/** Patterns that indicate a professionally relevant query */
export const PROFESSIONAL_PATTERNS = {
  technical: /\b(?:code|coding|program|develop|software|web|app|api|database|tech|stack)\b/i,
  skills: /\b(?:skill|knowledge|experience|proficiency|expertise|learn|familiar)\b/i,
  projects: /\b(?:project|built|created|portfolio|deployed|application)\b/i,
  career: /\b(?:work|job|career|interview|hire|position|role|responsibility)\b/i,
  education: /\b(?:education|university|college|degree|study|course|graduate)\b/i,
  questions: /\b(?:what|how|why|when|where|who|which|can|do|are|is|tell|describe|explain)\b/i,
  inquiry: /\b(?:about|yourself|background|introduction|achievements|strengths|goals)\b/i,
};

/** Patterns that trigger query rejection — keyed by error type */
export const REJECTION_PATTERNS: Record<string, RegExp> = {
  manipulation: /(?:ignore|forget|disregard).{0,20}(?:previous|instruction|rule|prompt|system)|(?:act as|pretend to be|jailbreak)/i,
  personal: /\b(?:girlfriend|boyfriend|dating|relationship|family|parents|address|phone|bank|password|salary|income|age|birthday)\b/i,
  inappropriate: /\b(?:hack|illegal|cheat|steal|pirate|crack|bypass|porn|sex|drugs|alcohol)\b/i,
  tech_preferences: /\b(?:prefer|like|choose|better)\b.{0,20}\b(?:mac|windows|linux|android|ios)\b|\b(?:pc specs?|computer specs?|hardware|RAM|graphics? card|processor|CPU|GPU|intel|amd|nvidia|macbook|gaming rig)\b/i,
  entertainment: /\b(?:favorite|like|watch|listen).{0,20}\b(?:movie|music|show|game|anime|netflix|spotify)\b|\b(?:gaming|games|xbox|playstation|nintendo|youtube|tiktok|instagram|band|artist|actor|celebrity)\b/i,
  general_offtopic: /\b(?:weather|temperature|forecast|sports?|football|basketball|soccer|news|politics|politician|recipe|cooking|food|restaurant|travel|vacation|joke|funny|meme)\b/i,
  offtopic: /\b(?:medical advice|legal advice|religion)\b/i,
};

/** Knowledge gap detection — queries we can flag early */
export const KNOWLEDGE_GAP_PATTERNS = [
  { pattern: /how long (?:did|have you|took).{0,30}(?:develop|build|work|take|spend)/i, type: 'timeline' },
  { pattern: /(?:timeline|duration|time frame).{0,20}(?:project|development|build)/i, type: 'timeline' },
  { pattern: /how many (?:users|downloads|visits|views|clicks)/i, type: 'metrics' },
  { pattern: /(?:traffic|revenue|conversion|performance) (?:numbers|metrics|stats)/i, type: 'metrics' },
  { pattern: /(?:salary|income|how much (?:do you make|earn)|home address|phone number)/i, type: 'personal_data' },
  { pattern: /^(?:tell me about yourself|what can you do|anything|everything)$/i, type: 'vague_inquiry' },
];

/** Suggested questions from the UI — always bypass validation */
export const SUGGESTED_QUESTION_PATTERNS = [
  /^what are your main projects\??$/i,
  /^tell me about your tech stack$/i,
  /^what competitions have you won\??$/i,
  /^what's your experience\??$/i,
  /^tell me about your education$/i,
  /^what technologies did you use\??$/i,
  /^any interesting challenges\??$/i,
  /^how did you approach it\??$/i,
  /^what was the outcome\??$/i,
  /^what did you study\??$/i,
  /^any notable achievements\??$/i,
];

/** Greeting patterns — always valid */
export const GREETING_PATTERN = /^(?:hi|hello|hey|greetings|good (?:morning|afternoon|evening)|sup|yo)$/i;

/** Follow-up patterns — bypass validation when session has history */
export const FOLLOW_UP_PATTERN = /^(yes|yeah|sure|ok|okay|tell me more|elaborate|continue|go on|please|why|how|what about)$/i;

// ─── Feedback Detection ──────────────────────────────────────────────

/** Patterns for detecting valid user feedback about response quality */
export const FEEDBACK_PATTERNS = {
  length: {
    shorter: /(?:too long|make it shorter|be more concise|less wordy|keep it brief|shorter response)/i,
    longer: /(?:too short|more detail|elaborate|expand on|tell me more|more context)/i,
  },
  detail: {
    more_specific: /(?:more specific|be more detailed|give examples|can you elaborate|explain more|what do you mean)/i,
    high_level: /(?:high level|overview|summary|just the basics|simplified)/i,
  },
  tone: {
    humble: /(?:you sounded? (?:too )?boastful|(?:too )?arrogant|(?:be )?more humble|(?:be )?less cocky|(?:sound )?(?:less )?overconfident|(?:don't )?brag)/i,
    confident: /(?:too humble|more confident|don't undersell|sell yourself better)/i,
  },
};

/** Patterns that are always rejected (manipulation / off-task) */
export const INVALID_REQUEST_PATTERNS = [
  /(?:ignore|forget|disregard).{0,20}(?:previous|instruction|rule|prompt|system)/i,
  /(?:pretend|act like|roleplay)/i,
  /(?:make up|fabricate|lie|fake).{0,20}(?:information|data|facts)/i,
  /(?:tell me|write).{0,30}(?:joke|poem|story|song)/i,
];

// ─── GenZ Validation (single source) ─────────────────────────────────
// response-validator uses this instead of maintaining its own Set.
// prompt-templates.ts keeps the PROMPT INSTRUCTIONS (what to tell the AI).
// This is the DETECTION vocabulary (what to check in responses).

import { genzSlang } from './prompt-templates';

/** Flat set of all GenZ slang for response validation scoring */
export const GENZ_SLANG_SET: Set<string> = new Set([
  ...genzSlang.useOften,
  ...genzSlang.useSometimes,
  ...genzSlang.spicyTier,
]);

export const CASUAL_STARTERS = [
  'yo', 'aight', 'so like', 'okay so', 'real talk', 'ngl', 'tbh', 'bruh', 'hey',
];

// ─── RAG Thresholds ──────────────────────────────────────────────────

export const RAG_THRESHOLDS = {
  /** Primary score filter */
  minScore: 0.75,
  /** Fallback tier — used when nothing passes minScore */
  fallbackScore: 0.65,
  /** Minimum score the route considers "good context" */
  routeMinScore: 0.6,
  /** Default top-K results */
  topK: 3,
};

// ─── FAQ Context Hints ───────────────────────────────────────────────
// Category-based hints instead of brittle chunk IDs.

export interface FAQPattern {
  category: string;
  question: string;
  keywords: string[];
  contextHint: string;
  relevance_boost: number;
}

export const FAQ_PATTERNS: FAQPattern[] = [
  {
    category: 'introduction',
    question: 'Tell me about yourself',
    keywords: ['about yourself', 'introduce yourself', 'who are you', 'background', 'tell me about'],
    contextHint: 'Focus on: personal profile, education, key projects, competition achievements',
    relevance_boost: 0.95,
  },
  {
    category: 'introduction',
    question: 'Why should we hire you?',
    keywords: ['why hire', 'why should we', 'what makes you', 'why you', 'hire you'],
    contextHint: 'Focus on: unique value proposition, competition achievements, deployed projects, technical skills',
    relevance_boost: 0.95,
  },
  {
    category: 'technical',
    question: 'What programming languages?',
    keywords: ['programming languages', 'languages', 'what languages', 'languages do you know'],
    contextHint: 'Focus on: programming languages with years and proficiency levels',
    relevance_boost: 0.95,
  },
  {
    category: 'technical',
    question: 'Tech stack and tools',
    keywords: ['tech stack', 'technologies', 'frameworks', 'tools', 'what do you use'],
    contextHint: 'Focus on: technical skills and tools - databases, cloud, frontend, backend, AI/ML',
    relevance_boost: 0.95,
  },
  {
    category: 'projects',
    question: 'Tell me about your projects',
    keywords: ['projects', 'what have you built', 'portfolio', 'applications', 'apps'],
    contextHint: 'Focus on: the capstone academic information system, Nihilita, the AI digital twin portfolio, and agentic AI work',
    relevance_boost: 0.93,
  },
  {
    category: 'achievements',
    question: 'What are your achievements?',
    keywords: ['achievements', 'accomplishments', 'awards', 'proud of', 'success'],
    contextHint: 'Focus on: key achievements, international competition, national competition',
    relevance_boost: 0.95,
  },
  {
    category: 'career',
    question: 'Career goals',
    keywords: ['career goals', 'future plans', 'where do you see yourself', 'aspirations', 'long term'],
    contextHint: 'Focus on: career goals, technical interests, learning focus',
    relevance_boost: 0.9,
  },
  {
    category: 'compensation',
    question: 'Salary expectations',
    keywords: ['salary', 'compensation', 'pay', 'rate', 'expectations'],
    contextHint: 'Focus on: salary and location preferences',
    relevance_boost: 0.85,
  },
  {
    category: 'interview',
    question: 'What are your weaknesses?',
    keywords: ['weakness', 'weaknesses', 'areas to improve', 'what you struggle'],
    contextHint: 'Focus on: weakness mitigation strategies',
    relevance_boost: 0.9,
  },
];
