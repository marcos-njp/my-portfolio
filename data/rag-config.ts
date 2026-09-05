/**
 * Central RAG Configuration
 *
 * Single source of truth for all patterns, thresholds, and dictionaries
 * used across lib/ utilities. Edit HERE, not in lib files.
 */

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
};

/** Knowledge gap detection — queries we can flag early */
export const KNOWLEDGE_GAP_PATTERNS = [
  { pattern: /how long (?:did|have you|took).{0,30}(?:develop|build|work|take|spend)/i, type: 'timeline' },
  { pattern: /(?:timeline|duration|time frame).{0,20}(?:project|development|build)/i, type: 'timeline' },
  { pattern: /how many (?:users|downloads|visits|views|clicks)/i, type: 'metrics' },
  { pattern: /(?:traffic|revenue|conversion|performance) (?:numbers|metrics|stats)/i, type: 'metrics' },
  { pattern: /(?:salary|income|how much (?:do you make|earn)|home address|phone number)/i, type: 'personal_data' },
  // NOTE: "tell me about yourself" and "what can you do" are standard interview
  // openers that FAQ_PATTERNS.introduction is built to answer, so they are NOT
  // knowledge gaps. Only genuinely contentless prompts belong here.
  { pattern: /^(?:anything|everything)$/i, type: 'vague_inquiry' },
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

export const RAG_THRESHOLDS = {
  /** Minimum score the route considers "good context" */
  routeMinScore: 0.6,
  /** Default top-K results. 3 was too narrow: broad questions like "what projects
   * have you built" dropped real chunks below the cut, and the model invented
   * details to fill the gap. */
  topK: 6,
};
