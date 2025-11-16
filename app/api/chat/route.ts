import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { Index } from '@upstash/vector';
import { searchVectorContext, buildContextPrompt } from '@/lib/rag-utils';
import { preprocessQuery } from '@/lib/query-preprocessor';
import { getMoodConfig, getPersonaResponse, type AIMood } from '@/lib/ai-moods';
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
  let mood: AIMood = 'professional'; // Declare outside try block for error handler access
  
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

    const { messages, mood: requestMood = 'professional', sessionId } = await req.json() as { 
      messages: Message[];
      mood?: AIMood;
      sessionId?: string;
    };
    mood = requestMood; // Assign to outer variable
    
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

    // ========== STEP 1: Check for Follow-Ups (Skip Validation) ==========
    const isShortFollowUp = cleanQuery.length < 15 && sessionHistory.length > 0;
    const followUpPatterns = /^(yes|yeah|sure|ok|okay|tell me more|elaborate|continue|go on|please|why|how|what about)$/i;
    const isFollowUpResponse = followUpPatterns.test(cleanQuery.trim());

    // ========== STEP 2: Vector Search with RAG ==========
    const ragContext = await searchVectorContext(vectorIndex, cleanQuery, {
      topK: 3, // Get top 3 most relevant chunks
      minScore: 0.6, // 60% threshold - balanced for quality context
      includeMetadata: true,
    });

    // ========== STEP 3: Graceful Fallback - Prevent Fabrication ==========
    // CRITICAL: Require minimum relevance to prevent making up information
    const hasGoodContext = ragContext.chunksUsed > 0 && ragContext.topScore >= 0.6;
    
    if (!hasGoodContext && !isShortFollowUp && !isFollowUpResponse) {
      console.log(`[Graceful Fallback] No relevant context (topScore: ${ragContext.topScore.toFixed(2)}, chunks: ${ragContext.chunksUsed}) for: "${cleanQuery}"`);
      
      // Use persona-aware fallback
      const rejectionMessage = getPersonaResponse('no_context', mood);
      
      return new Response(
        JSON.stringify({ 
          error: 'insufficient_context',
          message: rejectionMessage
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Build context prompt
    let contextInfo = '';
    
    // Add vector search context if we have good results
    if (ragContext.chunksUsed > 0) {
      contextInfo += buildContextPrompt(ragContext);
      contextInfo += '\n\n⚠️ CRITICAL: Only use information from the CONTEXT above. If the context doesn\'t contain the answer, say "I don\'t have that information in my knowledge base" - DO NOT make up or infer information.';
    } else {
      // If no vector context found, rely on conversation history
      contextInfo += '\n\n⚠️ WARNING: No specific vector context found. You MUST NOT fabricate information. Only answer if you have relevant context from conversation history.';
    }

    // Log relevance metrics
    console.log(`[RAG Metrics] Query: "${cleanQuery}" | Chunks: ${ragContext.chunksUsed} | Avg Score: ${(ragContext.averageScore * 100).toFixed(1)}% | Top Score: ${(ragContext.topScore * 100).toFixed(1)}%`);

    // ========== STEP 4: Generate AI Response with Mood + Adaptive Feedback ==========
    const feedbackInstruction = buildFeedbackInstruction(feedbackPreferences);
    const moodConfig = getMoodConfig(mood);
    
    console.log(`[AI Generation] Mood: ${mood}, Temperature: ${moodConfig.temperature}, Mood Name: ${moodConfig.name}`);
    if (feedbackInstruction) {
      console.log(`[Adaptive Feedback] Applying user preferences to this response`);
    }
    
    // Build final prompt with mood instructions
    const finalSystemPrompt = mood === 'genz'
      ? moodConfig.systemPromptAddition + '\n\n' +
        'REMINDER: You are in GenZ mode - use slang, emojis, and casual tone!\n\n' +
        SYSTEM_PROMPT + 
        conversationContext + 
        contextInfo +
        feedbackInstruction +
        '\n\n🔥 FINAL REMINDER: This is GenZ mode - be casual, use slang, add emojis! 💯'
      : moodConfig.systemPromptAddition + '\n\n' + 
        SYSTEM_PROMPT + 
        conversationContext + 
        contextInfo +
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
        const responseTime = Date.now() - startTime;
        console.log(`[Response] Generated in ${responseTime}ms, ${text.length} chars`);
        
        // Save conversation history with feedback preferences
        if (sessionId) {
          const updatedHistory: SessionMessage[] = [
            ...sessionHistory,
            { role: 'user', content: userQuery, timestamp: Date.now(), mood },
            { role: 'assistant', content: text, timestamp: Date.now(), mood },
          ];
          
          await saveConversationHistory(sessionId, updatedHistory, mood, feedbackPreferences);
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
      const rateLimitMessage = getPersonaResponse('rate_limit', mood || 'professional');
      
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: rateLimitMessage,
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