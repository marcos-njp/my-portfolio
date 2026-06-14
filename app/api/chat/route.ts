import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { Index } from '@upstash/vector';
import { FOLLOW_UP_PATTERN, RAG_THRESHOLDS } from '@/data/rag-config';
import { searchVectorContext, buildContextPrompt, validateContextRelevance } from '@/lib/rag-utils';
import { preprocessQuery } from '@/lib/query-preprocessor';
import { validateQuery, enhanceQuery } from '@/lib/query-validator';
import { findRelevantFAQPatterns, buildContextHints } from '@/lib/interviewer-faqs';
import { validateMoodCompliance } from '@/lib/response-validator';
import { getResponseLengthInstruction } from '@/lib/response-manager';
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

// Initialize Groq AI
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// Initialize Upstash Vector
const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL || '',
  token: process.env.UPSTASH_VECTOR_REST_TOKEN || '',
});

// System prompt - personality-first, concise. Tone details come from personality.json via mood config.
const SYSTEM_PROMPT = `You are Niño Justin Marcos's AI digital twin. Speak in first person as Niño ("I", "my", "me").

VOICE: Warm, concise, humble. You sweat the details and you never pad an answer. No boasting, no corporate jargon.

RULES:
- Answer the question first, then stop. One or two sentences for simple questions, three or four for complex ones.
- Be specific: use real names, tools, and numbers from CONTEXT. No vague filler.
- For follow-ups ("it", "that", "more"), use the conversation history.
- If something isn't in CONTEXT, say so briefly and offer what you do know. Never make things up.`;

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
    
    // Enhance query with professional terms
    const searchQuery = enhanceQuery(cleanQuery);

    // FAQ pattern matching - guides RAG to relevant chunks
    const faqMatches = findRelevantFAQPatterns(cleanQuery);
    const faqContextHints = faqMatches.length > 0 ? buildContextHints(faqMatches) : '';

    // Vector search with RAG
    const ragContext = await searchVectorContext(vectorIndex, searchQuery, {
      topK: RAG_THRESHOLDS.topK,
      minScore: RAG_THRESHOLDS.routeMinScore,
      includeMetadata: true,
    });

    // Knowledge gap detection - graceful fallback
    const hasGoodContext = ragContext.chunksUsed > 0 && ragContext.topScore >= RAG_THRESHOLDS.routeMinScore;
    
    let contextRelevance = { isRelevant: true, reason: '', confidence: 1.0 };
    if (hasGoodContext) {
      contextRelevance = validateContextRelevance(cleanQuery, ragContext.relevantChunks.join(' '), ragContext.topScore);
    }
    
    if ((!hasGoodContext || !contextRelevance.isRelevant) && !isShortFollowUp && !isFollowUpResponse) {
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
    const lengthInstruction = getResponseLengthInstruction();
    
    const finalSystemPrompt = [
      moodConfig.systemPromptAddition,
      mood === 'genz' ? 'REMINDER: You are in GenZ mode - use slang and casual tone!' : '',
      SYSTEM_PROMPT,
      conversationContext,
      contextInfo,
      faqContextHints,
      feedbackInstruction,
      lengthInstruction,
    ].filter(Boolean).join('\n');
    
    const startTime = Date.now();
    
    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: finalSystemPrompt,
      messages,
      temperature: moodConfig.temperature,
      onFinish: async ({ text }) => {
        console.log(`[Response] ${Date.now() - startTime}ms, ${text.length} chars, mood: ${mood}`);
        
        const moodValidation = validateMoodCompliance(text, mood);
        if (!moodValidation.compliant) {
          console.warn(`[Mood] ${mood} compliance: ${moodValidation.score}/100`);
        }
        
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
    
    if (isRateLimit) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', message: getPersonaResponse('rate_limit', mood || 'professional') }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Failed to generate response', message: getPersonaResponse('error', mood || 'professional') }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}