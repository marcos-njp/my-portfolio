import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { Index } from '@upstash/vector';
import { FOLLOW_UP_PATTERN, RAG_THRESHOLDS } from '@/data/rag-config';
import { searchVectorContext, buildContextPrompt } from '@/lib/rag-utils';
import { preprocessQuery, resolveFollowUpQuery } from '@/lib/query-preprocessor';
import { validateQuery } from '@/lib/query-validator';
import { getMoodConfig, getPersonaResponse, getSmartFallbackResponse, type AIMood } from '@/lib/ai-moods';
import { saveConversationHistory, loadSessionData, buildConversationContext } from '@/lib/session-memory';
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

let groqClient: ReturnType<typeof createGroq> | null = null;
let vectorIndex: Index | null = null;

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is missing');
  }

  if (!groqClient) {
    groqClient = createGroq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  return groqClient;
}

function getVectorIndex() {
  if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
    throw new Error('Upstash Vector environment variables are missing');
  }

  if (!vectorIndex) {
    vectorIndex = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    });
  }

  return vectorIndex;
}

// System prompt - personality-first, concise. Tone details come from personality.json via mood config.
const SYSTEM_PROMPT = `You are Niño Justin Marcos's AI digital twin. Speak in first person as Niño ("I", "my", "me").

VOICE: Warm, concise, humble. You sweat the details and you never pad an answer. No boasting, no corporate jargon.

RULES:
- Answer the question first, then stop. One or two sentences for simple questions, three or four for complex ones.
- Be specific: use real names, tools, and numbers from CONTEXT. No vague filler.
- For follow-ups ("it", "that", "more"), use the conversation history.
- If something isn't in CONTEXT, say so briefly and offer what you do know. Never make things up.
- Never use model version numbers (never say "GPT-4", "GPT-4.5", "GPT-5", "Claude 3.5", etc.). Always refer to foundation models only by their unversioned brand name: "GPT", "Claude", "Gemini".
- For data analyst questions: You have hands-on data analyst and profiling experience, including building the client-side Data Analyst Sandbox with in-browser Web Workers, descriptive statistics, Pearson correlation, and BM25 lexical RAG. If asked why you chose data analysis as a sub-focus, explain that you want to delve deeper into data science to understand how AI truly absorbs and learns from data, and because data is essential in business, stakeholder communication, and understanding the real problems software solves.

LENGTH: Be concise. One or two sentences for simple questions, up to four for complex ones. Hard cap around 150 words. Do not pad, repeat, or list everything. Specifics over length.`;

export async function POST(req: Request) {
  let mood: AIMood = 'professional';
  
  try {
    if (!process.env.GROQ_API_KEY || !process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error', message: 'Service not configured.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages, mood: requestMood = 'professional', sessionId } = await req.json() as { 
      messages: Message[];
      mood?: AIMood;
      sessionId?: string;
    };
    mood = requestMood;
    
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content;

    // Load session data (conversation history + feedback preferences)
    const sessionData = sessionId ? await loadSessionData(sessionId) : { messages: [], feedbackPreferences: null };
    const sessionHistory = sessionData.messages;
    const conversationContext = buildConversationContext(sessionHistory);
    let feedbackPreferences: FeedbackPreferences = sessionData.feedbackPreferences || { feedback: [] };

    // Preprocess query (fix typos)
    const preprocessed = preprocessQuery(userQuery);
    const cleanQuery = preprocessed.corrected;
    if (preprocessed.changes.length > 0) {
      console.log(`[Typo Fix] "${userQuery}" -> "${cleanQuery}"`);
    }

    // Detect follow-ups early
    const isShortFollowUp = cleanQuery.length < 15 && sessionHistory.length > 0;
    const isFollowUpResponse = FOLLOW_UP_PATTERN.test(cleanQuery.trim());

    // Reject unprofessional requests
    if (isUnprofessionalRequest(cleanQuery)) {
      return new Response(
        JSON.stringify({ error: 'unprofessional_request', message: getUnprofessionalRejection(cleanQuery, mood) }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Detect user feedback and learn preferences
    const detectedFeedback = detectFeedback(cleanQuery);
    let isFeedbackQuery = false;
    
    if (detectedFeedback) {
      isFeedbackQuery = true;
      if (detectedFeedback.isProfessional) {
        feedbackPreferences = applyFeedback(feedbackPreferences, detectedFeedback);
      }
    }

    // Query validation (skip for feedback/follow-ups)
    const shouldSkipValidation = isFeedbackQuery || isShortFollowUp || isFollowUpResponse;
    
    if (!shouldSkipValidation) {
      const validation = validateQuery(cleanQuery);
      
      if (!validation.isValid) {
        const errorMessage = validation.errorType 
          ? getPersonaResponse(validation.errorType, mood)
          : validation.reason;
        
        return new Response(
          JSON.stringify({ error: 'invalid_query', message: errorMessage }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Resolve references against history BEFORE embedding. Without this a query
    // like "tell me more about that first one" is embedded verbatim, retrieves
    // unrelated chunks that still clear the score threshold, and the model
    // invents details to bridge the gap.
    const resolved = resolveFollowUpQuery(cleanQuery, sessionHistory);
    if (resolved.resolved) {
      console.log(`[Follow-up] resolved "${cleanQuery}" using ${sessionHistory.length} prior message(s)`);
    }

    const searchQuery = resolved.searchQuery;

    // Vector search with RAG
    const ragContext = await searchVectorContext(getVectorIndex(), searchQuery, {
      topK: RAG_THRESHOLDS.topK,
      minScore: RAG_THRESHOLDS.routeMinScore,
      includeMetadata: true,
    });

    // Retrieval infrastructure failure is NOT a knowledge gap -- never mask it as one.
    if (ragContext.retrievalFailed) {
      return new Response(
        JSON.stringify({
          error: 'Knowledge base unavailable',
          message: 'My knowledge base is unreachable right now, so I cannot answer accurately. Check the Upstash Vector URL and token.',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Knowledge gap detection - graceful fallback
    const hasGoodContext = ragContext.chunksUsed > 0 && ragContext.topScore >= RAG_THRESHOLDS.routeMinScore;
    
    if (!hasGoodContext && !isShortFollowUp && !isFollowUpResponse) {
      const smartFallback = getSmartFallbackResponse(cleanQuery, mood);
      return new Response(smartFallback, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // Build context from vector search results
    let contextInfo = '';
    if (ragContext.chunksUsed > 0) {
      contextInfo += buildContextPrompt(ragContext);
      contextInfo += '\n\nOnly use info from CONTEXT. If not found, say "I don\'t have that info".';
    } else {
      contextInfo += '\n\nNo vector context found. Only answer from conversation history. Do not fabricate.';
    }

    // Build final system prompt with mood + context + feedback
    const feedbackInstruction = buildFeedbackInstruction(feedbackPreferences);
    const moodConfig = getMoodConfig(mood);
    
    const finalSystemPrompt = [
      moodConfig.systemPromptAddition,
      mood === 'genz' ? 'REMINDER: You are in GenZ mode - use slang and casual tone!' : '',
      SYSTEM_PROMPT,
      conversationContext,
      contextInfo,
      feedbackInstruction,
    ].filter(Boolean).join('\n');
    
    const startTime = Date.now();
    
    const result = streamText({
      model: getGroqClient()('openai/gpt-oss-120b'),
      system: finalSystemPrompt,
      messages,
      temperature: moodConfig.temperature,
      maxOutputTokens: 2048,
      providerOptions: { groq: { reasoningEffort: 'medium' } },
      onFinish: async ({ text }) => {
        console.log(`[Response] ${Date.now() - startTime}ms, ${text.length} chars, mood: ${mood}`);
        
        if (sessionId) {
          await saveConversationHistory(sessionId, [
            ...sessionHistory,
            { role: 'user', content: userQuery, timestamp: Date.now(), mood },
            { role: 'assistant', content: text, timestamp: Date.now(), mood },
          ], mood, feedbackPreferences);
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isRateLimit = /429|rate limit|Too Many Requests/i.test(errorMessage);
    const isConfigError = /missing|required environment variables|not configured/i.test(errorMessage);
    const isAuthError = /401|403|unauthorized|forbidden|invalid api key|authentication/i.test(errorMessage);
    const isUpstashError = /upstash|vector/i.test(errorMessage);
    
    if (isRateLimit) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', message: getPersonaResponse('rate_limit', mood || 'professional') }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (isConfigError) {
      return new Response(
        JSON.stringify({
          error: 'Server configuration error',
          message: 'Deployment is missing one or more AI service environment variables.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (isAuthError) {
      return new Response(
        JSON.stringify({
          error: 'Authentication failed',
          message: 'The AI service key appears invalid or expired. Check the Groq and Upstash tokens in deployment.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (isUpstashError) {
      return new Response(
        JSON.stringify({
          error: 'Knowledge base unavailable',
          message: 'The Upstash Vector connection failed. Check the vector URL and token in deployment.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Failed to generate response', message: getPersonaResponse('error', mood || 'professional') }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
