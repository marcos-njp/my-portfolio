/**
 * Query Validation and Filtering System
 * Ensures user queries are relevant to professional/career topics
 */

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  category?: string;
  confidence: number;
}

// Relevant topic categories
const RELEVANT_CATEGORIES = [
  'technical_skills',
  'projects',
  'experience',
  'education',
  'achievements',
  'career_goals',
  'work_preferences',
  'programming',
  'frameworks',
  'tools',
  'background',
  'introduction',
  'interview',
  'professional',
];

// Keywords for relevant professional queries
const PROFESSIONAL_KEYWORDS = [
  // Technical
  'programming', 'code', 'development', 'software', 'web', 'app', 'application',
  'frontend', 'backend', 'fullstack', 'full-stack', 'database', 'api', 'framework',
  'javascript', 'typescript', 'python', 'react', 'next.js', 'nextjs', 'node',
  'git', 'github', 'vercel', 'deployment', 'testing', 'debugging',
  
  // Projects & Experience
  'project', 'portfolio', 'built', 'created', 'developed', 'deployed', 'work',
  'experience', 'internship', 'ojt', 'job', 'role', 'position',
  
  // Skills & Knowledge
  'skill', 'knowledge', 'proficiency', 'expertise', 'ability', 'capability',
  'familiar', 'experienced', 'proficient', 'advanced', 'beginner',
  
  // Education & Achievements
  'education', 'university', 'degree', 'graduate', 'study', 'student',
  'achievement', 'award', 'competition', 'contest', 'certificate',
  
  // Interview & Career
  'interview', 'hire', 'salary', 'compensation', 'remote', 'location',
  'career', 'goal', 'ambition', 'future', 'plan', 'aspiration',
  'strength', 'weakness', 'challenge', 'learn', 'improve',
  
  // Personal Professional
  'about', 'yourself', 'who', 'background', 'introduction', 'tell me',
  'describe', 'explain', 'what', 'why', 'how', 'when', 'where',
];

// Keywords for irrelevant/off-topic queries
const IRRELEVANT_KEYWORDS = [
  // Personal/Private
  'girlfriend', 'boyfriend', 'dating', 'relationship', 'family', 'parents',
  'home address', 'phone number', 'bank', 'credit card', 'password',
  
  // Inappropriate
  'hack', 'illegal', 'cheat', 'steal', 'pirate', 'crack',
  
  // Unrelated Topics (NOTE: 'movie' removed - Niño has a Movie App project!)
  'weather', 'sports', 'politics', 'religion', 'celebrity', 'gossip',
  'game', 'recipe', 'health', 'medical', 'legal advice',
  'financial advice', 'investment',
  
  // System Manipulation
  'ignore previous', 'system prompt', 'instructions', 'forget everything',
  'act as', 'pretend to be', 'jailbreak',
];

// Greeting patterns
const GREETINGS = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'];

/**
 * Validate if a query is relevant to professional/career discussion
 */
export function validateQuery(query: string): ValidationResult {
  const queryLower = query.toLowerCase().trim();
  
  // Empty query
  if (!queryLower || queryLower.length < 3) {
    return {
      isValid: false,
      reason: "Query too short. Please ask a specific question about my experience, skills, or projects.",
      confidence: 1.0
    };
  }
  
  // Just a greeting
  if (GREETINGS.includes(queryLower)) {
    return {
      isValid: true,
      category: 'greeting',
      confidence: 1.0
    };
  }
  
  // Check for irrelevant keywords
  const hasIrrelevantKeywords = IRRELEVANT_KEYWORDS.some(keyword => 
    queryLower.includes(keyword.toLowerCase())
  );
  
  if (hasIrrelevantKeywords) {
    return {
      isValid: false,
      reason: "I'm designed to answer questions about my professional background, skills, projects, and career. Please ask about my technical experience, education, or work preferences.",
      confidence: 0.95
    };
  }
  
  // Check for professional keywords
  const professionalMatches = PROFESSIONAL_KEYWORDS.filter(keyword => 
    queryLower.includes(keyword.toLowerCase())
  ).length;
  
  // Question words/phrases
  const questionPatterns = [
    'what', 'why', 'how', 'when', 'where', 'who', 'which',
    'tell me', 'describe', 'explain', 'can you', 'do you',
    'have you', 'are you', 'did you', 'will you'
  ];
  
  const hasQuestionPattern = questionPatterns.some(pattern => 
    queryLower.includes(pattern)
  );
  
  // Calculate confidence
  let confidence = 0.5;
  
  if (professionalMatches >= 3) confidence = 0.95;
  else if (professionalMatches >= 2) confidence = 0.85;
  else if (professionalMatches >= 1) confidence = 0.75;
  else if (hasQuestionPattern) confidence = 0.65;
  
  // Determine category
  let category = 'general';
  if (queryLower.includes('skill') || queryLower.includes('programming') || queryLower.includes('language')) {
    category = 'technical_skills';
  } else if (queryLower.includes('project') || queryLower.includes('built') || queryLower.includes('portfolio')) {
    category = 'projects';
  } else if (queryLower.includes('education') || queryLower.includes('university') || queryLower.includes('degree')) {
    category = 'education';
  } else if (queryLower.includes('experience') || queryLower.includes('work') || queryLower.includes('job')) {
    category = 'experience';
  } else if (queryLower.includes('achievement') || queryLower.includes('award') || queryLower.includes('competition')) {
    category = 'achievements';
  }
  
  // Validate based on professional context
  if (confidence >= 0.65 || professionalMatches > 0) {
    return {
      isValid: true,
      category,
      confidence
    };
  }
  
  // Fallback: allow most questions but with lower confidence
  if (hasQuestionPattern && queryLower.length > 5) {
    return {
      isValid: true,
      category: 'general',
      confidence: 0.55
    };
  }
  
  return {
    isValid: false,
    reason: "I can answer questions about my professional background, technical skills, projects, education, and career. What would you like to know?",
    confidence: 0.8
  };
}

/**
 * Enhance query for better vector search results
 */
export function enhanceQuery(query: string): string {
  const queryLower = query.toLowerCase();
  
  // Add context to vague queries
  if (queryLower.includes('tell me about yourself') || queryLower === 'about you') {
    return `${query} including technical skills, projects, education, and achievements`;
  }
  
  if (queryLower.includes('what can you do') || queryLower.includes('capabilities')) {
    return `technical skills, programming languages, frameworks, projects, and achievements`;
  }
  
  if (queryLower.includes('experience') && !queryLower.includes('work')) {
    return `${query} work experience and projects`;
  }
  
  // Return original query if no enhancement needed
  return query;
}

/**
 * Check if query is asking about capabilities/limitations
 */
export function isMetaQuery(query: string): boolean {
  const metaPatterns = [
    'what can you',
    'what do you do',
    'how do you work',
    'what are you',
    'who made you',
    'how were you built',
    'what\'s your purpose',
  ];
  
  const queryLower = query.toLowerCase();
  return metaPatterns.some(pattern => queryLower.includes(pattern));
}
