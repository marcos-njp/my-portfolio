import { Sparkles } from "lucide-react";
import { 
  DocSection, 
  DocPageLayout,
  AlertBox, 
  MetricGrid,
  HighlightBox,
  CodeBlock,
  Tabs,
  ComparisonGrid
} from "@/components/docs/common";
import { advancedFeatureMetrics } from "@/data/docs";

export function AdvancedFeaturesSection() {
  const advancedTabs = [
    {
      id: "dual-storage",
      label: "Dual Storage Architecture",
      content: (
        <div className="space-y-4">
          <HighlightBox type="info" title="Redis-Backed Dual Storage">
            <p className="text-xs">Separate storage strategies optimize both AI performance (token efficiency) and user experience (complete history)</p>
          </HighlightBox>

          <ComparisonGrid
            before={{
              title: "Session Memory (AI Context)",
              items: [
                "Last 8 messages only",
                "chat_session:{sessionId} key",
                "Optimized for token limits",
                "Used by AI for context"
              ]
            }}
            after={{
              title: "Chat History (UI Display)",
              items: [
                "Complete conversation",
                "chat_history:{sessionId} key",
                "Reloadable from the History button",
                "1 hour TTL"
              ]
            }}
          />

          <CodeBlock title="Implementation">
{`// lib/session-memory.ts - Dual storage system
export async function saveConversationHistory(
  sessionId: string, 
  messages: SessionMessage[],
  mood: string = 'professional',
  feedbackPreferences?: FeedbackPreferences
): Promise<void> {
  // SESSION MEMORY: Last 8 messages for AI context (token efficiency)
  const sessionMemory = messages.slice(-MAX_SESSION_MEMORY);
  const sessionData = {
    messages: sessionMemory,
    sessionId, mood, feedbackPreferences,
    createdAt: Date.now(), lastActive: Date.now()
  };
  
  // Save session memory (for AI context)
  await redis.setex(\`chat_session:\${sessionId}\`, SESSION_TTL, 
    JSON.stringify(sessionData));
  
  // CHAT HISTORY: Complete conversation for UI display
  await redis.setex(\`chat_history:\${sessionId}\`, CHAT_HISTORY_TTL, 
    JSON.stringify({ messages: messages, sessionId, createdAt: Date.now() }));
}`}
          </CodeBlock>
        </div>
      )
    },
    {
      id: "persona-errors", 
      label: "Persona-Aware Error Handling",
      content: (
        <div className="space-y-4">
          <HighlightBox type="warning" title="11 Error Categories with Dual Personalities">
            <p className="text-xs">Each error type has both Professional and GenZ responses maintaining personality consistency</p>
          </HighlightBox>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Professional Responses</h4>
              <div className="space-y-1 text-xs">
                <p><strong>unrelated:</strong> &ldquo;I&rsquo;m here to discuss Niño&rsquo;s professional background...&rdquo;</p>
                <p><strong>too_short:</strong> &ldquo;Please ask a more specific question about my skills...&rdquo;</p>
                <p><strong>knowledge_gap:</strong> &ldquo;I don&rsquo;t have that specific information documented...&rdquo;</p>
                <p><strong>tech_preferences:</strong> &ldquo;I focus on discussing my professional development work...&rdquo;</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">GenZ Responses</h4>
              <div className="space-y-1 text-xs">
                <p><strong>unrelated:</strong> &ldquo;yo that&rsquo;s off topic - let&rsquo;s talk about the portfolio stuff...&rdquo;</p>
                <p><strong>too_short:</strong> &ldquo;bro that&rsquo;s too short 😭 gimme more details...&rdquo;</p>
                <p><strong>knowledge_gap:</strong> &ldquo;yo don&rsquo;t have those exact deets 😅 but i can break down...&rdquo;</p>
                <p><strong>tech_preferences:</strong> &ldquo;yo we keeping this about my dev work and projects fr ...&rdquo;</p>
              </div>
            </div>
          </div>

          <CodeBlock title="Error Response System">
{`// lib/ai-moods.ts - Persona-aware error handling
export function getPersonaResponse(
  type: 'no_context' | 'unrelated' | 'manipulation' | 'rate_limit' | 'error' | 
        'too_short' | 'knowledge_gap' | 'tech_preferences' | 'entertainment' | 
        'personal' | 'inappropriate',
  mood: AIMood,
  query?: string
): string {
  const responses = {
    unrelated: {
      professional: "I'm here to discuss Niño's professional background...",
      genz: "yo that's off topic - let's talk about the portfolio stuff...",
    },
    // 10 more error types with dual responses...
  };
  return responses[type][mood];
}

// Usage in API route
if (validation.errorType) {
  const errorMessage = getPersonaResponse(validation.errorType, mood);
  return new Response(JSON.stringify({ error: errorMessage }));
}`}
          </CodeBlock>
        </div>
      )
    },
    {
      id: "semantic-validation",
      label: "Semantic Query Validation", 
      content: (
        <div className="space-y-4">
          <HighlightBox type="info" title="Pattern-Based Intelligence">
            <p className="text-xs">Replaced hardcoded keyword lists with intelligent regex patterns for robust query classification and better maintainability</p>
          </HighlightBox>

          <ComparisonGrid
            before={{
              title: "Old: Keyword Matching",
              items: [
                "Static word lists",
                "Case-sensitive matching", 
                "Binary valid/invalid",
                "Difficult to maintain"
              ]
            }}
            after={{
              title: "New: Semantic Patterns",
              items: [
                "Dynamic regex patterns",
                "Context-aware validation",
                "Confidence scoring (0-1)",
                "Professional relevance detection"
              ]
            }}
          />

          <CodeBlock title="Validation Engine">
{`// lib/query-validator.ts - Semantic pattern validation
const PROFESSIONAL_PATTERNS = {
  technical: /\\b(?:code|coding|program|develop|software|web|app|api|database|tech|stack)\\b/i,
  skills: /\\b(?:skill|knowledge|experience|proficiency|expertise|learn|familiar)\\b/i,
  projects: /\\b(?:project|built|created|portfolio|deployed|application)\\b/i,
  career: /\\b(?:work|job|career|interview|hire|position|role|responsibility)\\b/i,
};

const REJECTION_PATTERNS = {
  personal: /\\b(?:girlfriend|boyfriend|dating|relationship|family|parents|address|phone|bank|password|salary|income)\\b/i,
  tech_preferences: /\\b(?:prefer|like|choose|better)\\b.{0,20}\\b(?:mac|windows|linux|android|ios)\\b/i,
  entertainment: /\\b(?:favorite|like|watch|listen).{0,20}\\b(?:movie|music|show|game|anime|netflix)\\b/i,
};

export function validateQuery(query: string): ValidationResult {
  // Calculate professional relevance using semantic patterns
  let professionalScore = 0;
  let matchedCategories: string[] = [];
  
  for (const [category, pattern] of Object.entries(PROFESSIONAL_PATTERNS)) {
    if (pattern.test(queryLower)) {
      professionalScore++;
      matchedCategories.push(category);
    }
  }
  
  // Calculate confidence based on pattern matches
  let confidence = professionalScore >= 3 ? 0.95 : 
                  professionalScore >= 2 ? 0.85 : 
                  professionalScore >= 1 ? 0.75 : 0.65;
  
  return { isValid: confidence >= 0.65, confidence, category };
}`}
          </CodeBlock>
        </div>
      )
    },
    {
      id: "adaptive-feedback",
      label: "Adaptive Feedback Learning",
      content: (
        <div className="space-y-4">
          <HighlightBox type="success" title="User Preference Learning">
            <p className="text-xs">System learns from user feedback (&lsquo;be more detailed&rsquo;, &lsquo;shorter responses&rsquo;) and applies preferences consistently throughout the session</p>
          </HighlightBox>

          <div className="grid md:grid-cols-3 gap-4">
            <HighlightBox type="info" title="Length Adaptation">
              <p className="text-xs">Detects &ldquo;too long/short&rdquo; feedback and adjusts response length</p>
            </HighlightBox>
            <HighlightBox type="info" title="Detail Control">
              <p className="text-xs">Learns preference for specific examples vs high-level overviews</p>
            </HighlightBox>
            <HighlightBox type="info" title="Tone Adjustment">
              <p className="text-xs">Adapts between humble and confident based on user feedback</p>
            </HighlightBox>
          </div>

          <CodeBlock title="Feedback Detection & Learning">
{`// lib/feedback-detector.ts - Adaptive learning system
const VALID_FEEDBACK_PATTERNS = {
  length: {
    shorter: /(?:too long|make it shorter|be more concise|less wordy|keep it brief)/i,
    longer: /(?:too short|more detail|elaborate|expand on|tell me more)/i,
  },
  detail: {
    more_specific: /(?:more specific|be more detailed|give examples|can you elaborate)/i,
    high_level: /(?:high level|overview|summary|just the basics|simplified)/i,
  },
  tone: {
    humble: /(?:too boastful|too arrogant|be more humble|less cocky|don't brag)/i,
    confident: /(?:too humble|more confident|don't undersell|sell yourself better)/i,
  },
};

export function detectFeedback(message: string): UserFeedback | null {
  // Check for valid feedback patterns and apply to session preferences
  if (VALID_FEEDBACK_PATTERNS.length.shorter.test(message)) {
    return {
      type: 'length',
      instruction: 'Keep responses shorter and more concise',
      isProfessional: true,
      timestamp: Date.now(),
    };
  }
  // ... more pattern detection
}

export function buildFeedbackInstruction(preferences: FeedbackPreferences): string {
  const instructions: string[] = [];
  
  if (preferences.responseLength === 'shorter') {
    instructions.push('User wants: SHORT (1-2 sentences)');
  }
  
  if (preferences.detailLevel === 'more_specific') {
    instructions.push(\`USER PREFERENCE: Be SPECIFIC - include concrete examples\`);
  }
  
  return instructions.length > 0 ? 
    '\\n\\nADAPTIVE FEEDBACK:\\n' + instructions.join('\\n') : '';
}`}
          </CodeBlock>
        </div>
      )
    },
    {
      id: "rag-optimization",
      label: "RAG Context Optimization",
      content: (
        <div className="space-y-4">
          <HighlightBox type="info" title="Upstash Vector + Redis Integration">
            <p className="text-xs">Semantic search with relevance threshold (0.75), context validation, and intelligent fallback strategies</p>
          </HighlightBox>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Search Optimization</h4>
              <div className="space-y-1 text-xs">
                <p>• <strong>Relevance threshold:</strong> 0.75 for balanced accuracy</p>
                <p>• <strong>Fallback tier:</strong> top 2 results if they clear 0.65</p>
                <p>• <strong>Context validation:</strong> verify answers match questions</p>
                <p>• <strong>Smart fallbacks:</strong> knowledge gap detection</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Context Assembly</h4>
              <div className="space-y-1 text-xs">
                <p>• <strong>Session memory:</strong> Last 8 messages for AI</p>
                <p>• <strong>Vector results:</strong> Top 3 relevant chunks</p>
                <p>• <strong>Feedback prefs:</strong> User learning applied</p>
                <p>• <strong>Mood context:</strong> Personality-aware prompts</p>
              </div>
            </div>
          </div>

          <CodeBlock title="RAG Pipeline">
{`// lib/rag-utils.ts - Enhanced RAG with validation
export async function searchVectorContext(
  vectorIndex: Index,
  query: string,
  options: { topK?: number; minScore?: number } = {}
): Promise<RAGContext> {
  const { topK = 3, minScore = 0.75 } = options;

  const results = await vectorIndex.query({
    data: query, topK, includeMetadata: true,
  }) as VectorResult[];

  // Filter by relevance threshold
  const relevantResults = results.filter(result => result.score >= minScore);
  
  // If no results meet threshold, use top 2 if reasonably good (>0.65)
  if (relevantResults.length === 0) {
    const topResults = results.slice(0, 2).filter(r => r.score >= 0.65);
    if (topResults.length > 0) {
      return formatRAGContext(topResults);
    }
  }
  
  return formatRAGContext(relevantResults);
}

// Context relevance validation
export function validateContextRelevance(
  query: string, 
  retrievedContext: string, 
  ragScore: number
): { isRelevant: boolean; reason: string; confidence: number } {
  
  // Check for timeline questions - need time indicators
  if (/how long|timeline|duration/.test(query.toLowerCase())) {
    const hasTimeInfo = /\\b(?:\\d+\\s*(?:hours?|days?|weeks?|months?)|took|spent)\\b/i
      .test(retrievedContext);
    if (!hasTimeInfo) {
      return {
        isRelevant: false,
        reason: 'Context lacks timeline information for timeline question',
        confidence: 0.8
      };
    }
  }
  
  return { isRelevant: true, reason: 'Context appears relevant', confidence: ragScore };
}`}
          </CodeBlock>
        </div>
      )
    }
  ];

  return (
    <DocPageLayout
      title="Advanced Features"
      subtitle="Dual storage system, persona-aware errors, semantic validation, adaptive learning, and RAG optimization powering the AI digital twin."
    >
      <AlertBox type="info" icon={Sparkles} title="Intelligent AI System">
        <p>Advanced features working together to create sophisticated AI interactions that feel natural, maintain consistency, and continuously improve based on user feedback while optimizing for both performance and user experience.</p>
      </AlertBox>

      <DocSection title="System Metrics">
        <MetricGrid metrics={advancedFeatureMetrics} columns={3} />
      </DocSection>

      <DocSection title="Core Features">
        <Tabs items={advancedTabs} defaultTab="dual-storage" layout="scroll" />
      </DocSection>
    </DocPageLayout>
  );
}
