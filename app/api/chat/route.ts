import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { Index } from '@upstash/vector';
import { validateQuery, enhanceQuery, isMetaQuery, type ValidationResult } from '@/lib/query-validator';
import { searchVectorContext, buildContextPrompt } from '@/lib/rag-utils';
import { findRelevantFAQPatterns } from '@/lib/interviewer-faqs';
import { preprocessQuery } from '@/lib/query-preprocessor';
import { getResponseLengthInstruction } from '@/lib/response-manager';
import { getMoodConfig, type AIMood } from '@/lib/ai-moods';
import { 
  saveConversationHistory, 
  loadConversationHistory,
  loadFeedbackPreferences,
  buildConversationContext,
  type SessionMessage 
} from '@/lib/session-memory';
import {
  detectFeedback,
  applyFeedback,
  buildFeedbackInstruction,
  isUnprofessionalRequest,
  getUnprofessionalRejection,
  type FeedbackPreferences,
} from '@/lib/feedback-detector';
import { validateMoodCompliance, logValidationResult, getMoodComplianceScore } from '@/lib/response-validator';

// Edge Runtime configuration for Vercel
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Validate environment variables
if (!process.env.GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY is not set in environment variables');
}
if (!process.env.UPSTASH_VECTOR_REST_URL) {
  console.error('❌ UPSTASH_VECTOR_REST_URL is not set in environment variables');
}
if (!process.env.UPSTASH_VECTOR_REST_TOKEN) {
  console.error('❌ UPSTASH_VECTOR_REST_TOKEN is not set in environment variables');
}

// Initialize Groq AI
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// Initialize Upstash Vector
const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL || '',
  token: process.env.UPSTASH_VECTOR_REST_TOKEN || '',
});

// System prompt - Clear and focused
const SYSTEM_PROMPT = `You are Niño Marcos's AI digital twin. Answer questions using the CONTEXT PROVIDED below.

CRITICAL RULES:
1. CHECK CONVERSATION HISTORY FIRST for follow-ups - if user says "it", "them", "that", "more details", look at what YOU just said
2. ALWAYS use specific details from context - names, numbers, technologies, achievements
3. For project questions: mention specific project names, tech stacks, and features from context
4. Answer AS Niño in first person ("I", "my", "me")
5. Keep responses 2-4 sentences unless the question needs more detail
6. Never give generic answers like "I can answer questions about..." - give the ACTUAL answer

EXAMPLE OF FOLLOW-UPS:
You: "I built AI-Powered Portfolio, Person Search, and Modern Portfolio. Want details?"
User: "the tech stacks of it"
You: "AI-Powered Portfolio uses Next.js 15, Groq AI, Upstash Vector. Person Search uses Next.js, OAuth, Prisma, PostgreSQL. Modern Portfolio uses Next.js 15, Framer Motion, Tailwind CSS."

EXAMPLE OF SPECIFIC ANSWERS:
Bad: "I can answer questions about my projects"
Good: "I built an AI-Powered Portfolio with RAG using Next.js 15, Groq AI, and Upstash Vector. I also created a Person Search app with OAuth and PostgreSQL."

STYLE: Specific, confident, and helpful. Use real data from context.`;

export async function POST(req: Request) {
  try {
    // Validate environment variables at runtime
    if (!process.env.GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY missing');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          message: 'AI service not configured. Please check environment variables.',
          details: 'GROQ_API_KEY is missing'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
      console.error('❌ Upstash Vector credentials missing');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          message: 'Vector database not configured.',
          details: 'Upstash credentials missing'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages, mood = 'professional', sessionId } = await req.json() as { 
      messages: Message[];
      mood?: AIMood;
      sessionId?: string;
    };
    
    // Get the latest user message
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content;

    // ========== LOAD SESSION HISTORY & FEEDBACK PREFERENCES ==========
    const sessionHistory = sessionId ? await loadConversationHistory(sessionId) : [];
    const conversationContext = buildConversationContext(sessionHistory);
    
    // Load existing feedback preferences
    let feedbackPreferences: FeedbackPreferences = sessionId 
      ? await loadFeedbackPreferences(sessionId) || { feedback: [] }
      : { feedback: [] };

    // ========== STEP 0: Preprocess Query (Fix Typos) ==========
    const preprocessed = preprocessQuery(userQuery);
    const cleanQuery = preprocessed.corrected;
    
    // Log if typos were fixed
    if (preprocessed.changes.length > 0) {
      console.log(`[Typo Fix] Original: "${userQuery}" → Corrected: "${cleanQuery}" (${preprocessed.changes.join(', ')})`);
    }

    // ========== STEP 0.5: Check for Unprofessional Requests ==========
    if (isUnprofessionalRequest(cleanQuery)) {
      console.log(`[Adaptive Feedback] Rejected unprofessional request: "${cleanQuery}"`);
      return new Response(
        JSON.stringify({ 
          error: 'unprofessional_request',
          message: getUnprofessionalRejection(cleanQuery, mood)
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // ========== STEP 0.6: Detect User Feedback & Learn ==========
    const detectedFeedback = detectFeedback(cleanQuery);
    if (detectedFeedback) {
      console.log(`[Adaptive Feedback] Detected ${detectedFeedback.type} feedback:`, detectedFeedback.instruction);
      
      if (detectedFeedback.isProfessional) {
        // Apply and save feedback preferences
        feedbackPreferences = applyFeedback(feedbackPreferences, detectedFeedback);
        console.log(`[Adaptive Feedback] Updated preferences:`, feedbackPreferences);
      } else {
        // Log unprofessional feedback but don't apply it
        console.log(`[Adaptive Feedback] Rejected unprofessional feedback:`, detectedFeedback.instruction);
      }
    }

    // ========== STEP 1: Validate Query (SKIP for follow-ups with context) ==========
    const isShortFollowUp = cleanQuery.length < 15 && sessionHistory.length > 0;
    const followUpPatterns = /^(yes|yeah|sure|ok|okay|tell me more|elaborate|continue|go on|please|why|how|what about)$/i;
    const isFollowUpResponse = followUpPatterns.test(cleanQuery.trim());
    
    let validation: ValidationResult = { isValid: true, reason: '', category: 'follow-up', confidence: 1.0 };
    
    // Only validate if NOT a short follow-up with conversation history
    if (!isShortFollowUp && !isFollowUpResponse) {
      validation = validateQuery(cleanQuery);
      
      if (!validation.isValid) {
        const invalidMessage = mood === 'genz'
          ? "That's not my vibe chief, we talking about my portfolio here fr 🔥 Ask about my projects, skills, or experience"
          : validation.reason || "Please ask about my professional background, skills, or projects.";
        
        return new Response(
          JSON.stringify({ 
            error: 'invalid_query',
            message: invalidMessage
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    } else if (isFollowUpResponse && sessionHistory.length > 0) {
      console.log(`[Follow-Up] Detected follow-up response: "${cleanQuery}" - skipping validation, using context`);
    }

    // ========== STEP 2: Check FAQ Patterns for Context Hints ==========
    const relevantPatterns = findRelevantFAQPatterns(cleanQuery, 2);
    let contextHints = '';
    
    if (relevantPatterns.length > 0) {
      contextHints = '\n\nCONTEXT FOCUS AREAS:\n' + 
        relevantPatterns.map((pattern, idx) => 
          `${idx + 1}. ${pattern.contextHint} (Category: ${pattern.category})`
        ).join('\n');
    }

    // ========== STEP 3: Enhance Query for Better Vector Search ==========
    const enhancedQuery = enhanceQuery(cleanQuery);

    // ========== STEP 4: Vector Search with Enhanced RAG ==========
    const ragContext = await searchVectorContext(vectorIndex, enhancedQuery, {
      topK: 3, // Get top 3 most relevant chunks
      minScore: 0.6, // 60% threshold - balanced for quality context
      includeMetadata: true,
    });

    // ========== STEP 4.5: Graceful Fallback for Very Low RAG Scores ==========
    const hasContextHints = contextHints.length > 0;
    
    // Only trigger fallback for very poor context (topScore < 0.2) AND no chunks
    if (ragContext.chunksUsed === 0 && ragContext.topScore < 0.2 && !hasContextHints && !isShortFollowUp && !isFollowUpResponse) {
      console.log(`[Graceful Fallback] Low RAG score (${ragContext.topScore.toFixed(2)}) for: "${cleanQuery}"`);
      
      // Suggest related topics based on query category
      const fallbackSuggestions = validation.category === 'projects' 
        ? "summarize the most impressive projects"
        : validation.category === 'skills'
        ? "list the main technical skills and expertise areas"
        : validation.category === 'experience'
        ? "describe the work experience and roles"
        : "tell me about the educational background or career highlights";
      
      return new Response(
        JSON.stringify({ 
          error: 'insufficient_context',
          message: `Sorry, I couldn't find specific information about that. Would you like me to ${fallbackSuggestions}?`
        }),
        {
          status: 200, // Use 200 to avoid breaking the UI
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Build context prompt
    let contextInfo = '';
    
    // Include context hints if available (guides AI focus areas)
    if (contextHints) {
      contextInfo += '\n\n' + contextHints;
    }
    
    // Add vector search context if we have good results
    if (ragContext.chunksUsed > 0) {
      contextInfo += buildContextPrompt(ragContext);
    } else {
      // If no vector context found, use hints or default to core identity
      if (!contextHints) {
        contextInfo += '\n\nNOTE: No specific vector context found. Use available conversation context and general knowledge to provide a helpful answer about Niño Marcos.';
      }
    }

    // Log relevance metrics for monitoring
    console.log(`[RAG Metrics] Query: "${cleanQuery}" | Chunks: ${ragContext.chunksUsed} | Avg Score: ${(ragContext.averageScore * 100).toFixed(1)}% | Top Score: ${(ragContext.topScore * 100).toFixed(1)}%`);

    // Handle meta queries (about the AI itself)
    if (isMetaQuery(cleanQuery)) {
      contextInfo += `\n\nMETA INFO: This is an AI digital twin built with Groq AI (llama-3.1-8b-instant), Upstash Vector for semantic search, and Next.js. It answers questions about Niño Marcos's professional background with >75% relevance accuracy.`;
    }

    // ========== STEP 5: Generate AI Response with Mood + Adaptive Feedback ==========
    const responseLengthGuidelines = getResponseLengthInstruction();
    const feedbackInstruction = buildFeedbackInstruction(feedbackPreferences);
    const moodConfig = getMoodConfig(mood);
    
    console.log(`[AI Generation] Mood: ${mood}, Temperature: ${moodConfig.temperature}, Mood Name: ${moodConfig.name}`);
    if (feedbackInstruction) {
      console.log(`[Adaptive Feedback] Applying user preferences to this response`);
    }
    
    // CRITICAL: Adjust system prompt based on mood to prevent conflicts
    let baseSystemPrompt = SYSTEM_PROMPT;
    
    // For GenZ mode, relax the conciseness constraint to allow personality
    if (mood === 'genz') {
      baseSystemPrompt = baseSystemPrompt.replace(
        /Keep responses concise \(2-4 sentences\)/g,
        'Keep responses helpful and engaging (3-5 sentences with personality)'
      );
      console.log('[GenZ Mode] Adjusted base prompt for casual tone');
    }
    
    // Build final prompt with mood instructions FIRST and reinforced
    const finalSystemPrompt = mood === 'genz'
      ? moodConfig.systemPromptAddition + '\n\n' +
        'REMINDER: You are in GenZ mode - use slang, emojis, and casual tone in EVERY response!\n\n' +
        baseSystemPrompt + 
        conversationContext + 
        contextInfo + '\n\n' + 
        responseLengthGuidelines +
        feedbackInstruction +
        '\n\n🔥 FINAL REMINDER: This is GenZ mode - be casual, use slang, add emojis! 💯'
      : moodConfig.systemPromptAddition + '\n\n' + 
        baseSystemPrompt + 
        conversationContext + 
        contextInfo + '\n\n' + 
        responseLengthGuidelines +
        feedbackInstruction;
    
    console.log(`[System Prompt Preview] First 500 chars: ${finalSystemPrompt.substring(0, 500)}...`);
    console.log(`[System Prompt] Total length: ${finalSystemPrompt.length} chars, Mood: ${mood}`);
    
    // Estimate token usage (rough: 1 token ≈ 4 chars for English)
    const estimatedSystemTokens = Math.ceil(finalSystemPrompt.length / 4);
    const estimatedUserTokens = Math.ceil(userQuery.length / 4);
    const estimatedTotalInputTokens = estimatedSystemTokens + estimatedUserTokens;
    console.log(`[Token Estimate] System: ~${estimatedSystemTokens} tokens, User: ~${estimatedUserTokens} tokens, Total Input: ~${estimatedTotalInputTokens} tokens`);
    
    const startTime = Date.now();
    
    const result = streamText({
      model: groq('llama-3.1-8b-instant'),
      system: finalSystemPrompt,
      messages,
      temperature: moodConfig.temperature,
      onFinish: async ({ text }) => {
        const _responseTime = Date.now() - startTime;
        
        // Validate mood compliance
        const validation = validateMoodCompliance(text, mood);
        logValidationResult(validation, mood, text);
        
        const complianceScore = getMoodComplianceScore(text, mood);
        console.log(`[Mood Compliance] Score: ${complianceScore}/100 for ${mood} mode`);
        
        // Save conversation history with feedback preferences
        if (sessionId) {
          const updatedHistory: SessionMessage[] = [
            ...sessionHistory,
            { role: 'user', content: userQuery, timestamp: Date.now(), mood },
            { role: 'assistant', content: text, timestamp: Date.now(), mood },
          ];
          
          await saveConversationHistory(sessionId, updatedHistory, mood, feedbackPreferences);
          // Analytics removed - was unreliable and slowing responses
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('❌ Chat API error:', error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Check for Groq API rate limit errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const isRateLimit = errorMessage.includes('429') || 
                        errorMessage.includes('rate limit') || 
                        errorMessage.includes('Too Many Requests');
    
    if (isRateLimit) {
      console.error('❌ Groq API rate limit exceeded');
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please wait a moment and try again.',
          timestamp: new Date().toISOString()
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate response',
        message: errorMessage,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}