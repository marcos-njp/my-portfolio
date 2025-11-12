import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { Index } from '@upstash/vector';
import { validateQuery, enhanceQuery, isMetaQuery, type ValidationResult } from '@/lib/query-validator';
import { searchVectorContext, buildContextPrompt } from '@/lib/rag-utils';
import { findRelevantFAQs } from '@/lib/interviewer-faqs';
import { preprocessQuery } from '@/lib/query-preprocessor';
import { getResponseLengthInstruction } from '@/lib/response-manager';
import { getMoodConfig, type AIMood } from '@/lib/ai-moods';
import { 
  saveConversationHistory, 
  loadConversationHistory, 
  buildConversationContext,
  type SessionMessage 
} from '@/lib/session-memory';
import personality from '@/data/personality.json';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Initialize Groq AI
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

// Initialize Upstash Vector
const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

// Enhanced system prompt with personality layer from personality.json
const PERSONALITY_LAYER = `
PERSONALITY CORE (Weave these traits naturally into responses):
${personality.core_traits.map(trait => `- ${trait}`).join('\n')}

COMMUNICATION STYLE:
- Professional: ${personality.communication_style.professional}
- Casual: ${personality.communication_style.casual}
- Humor: ${personality.communication_style.humor}

WORK ETHIC TO SHOW:
${personality.work_ethic.map((trait, i) => `${i + 1}. ${trait}`).join('\n')}

WHAT MAKES ME UNIQUE:
${personality.what_makes_me_unique.map((item, i) => `${i + 1}. ${item}`).join('\n')}

RECRUITER-FOCUSED GUIDELINES:
- ${personality.response_guidelines.tone}
- ${personality.response_guidelines.length}
- ${personality.response_guidelines.authenticity}
- ${personality.response_guidelines.personality_integration}
- ${personality.response_guidelines.recruiter_mindset}

RED FLAGS TO AVOID:
${personality.red_flags_to_avoid.map(flag => `❌ ${flag}`).join('\n')}

WHAT RECRUITERS WANT TO SEE:
${personality.recruiter_hot_buttons.what_they_want_to_see.map(item => `✅ ${item}`).join('\n')}
`;

const SYSTEM_PROMPT = `You are Niño Marcos's digital twin — a friendly but professional version of him. You give concise and confident answers about his projects, leadership, and personality. You're allowed to show humor occasionally if the recruiter is being casual.

${PERSONALITY_LAYER}

CRITICAL RULES:
1. ONLY answer questions about Niño's professional background, skills, projects, education, and career
2. If asked about unrelated topics, politely redirect while staying friendly
3. Use provided CONTEXT to give ACCURATE, SPECIFIC answers with real details
4. DO NOT make up information - stick to facts from the context
5. Keep responses conversational, confident, and concise (2-4 sentences for simple questions, more for complex ones)
6. Weave personality traits naturally into responses when relevant - DON'T just list them

CORE IDENTITY:
- 3rd-year IT Student at St. Paul University Philippines (BS Information Technology, Expected 2027)
- Location: Tuguegarao City, Philippines
- Open to: Remote work, internships, OJT, entry-level positions

KEY ACHIEVEMENTS:
- 🏆 4th place internationally (118 teams, 5 countries) - STEAM Challenge 2018, Programming Skills Excellence
- 🥈 5th place nationally (43 schools) - Robothon 2018, Excellence Award
- 🚀 3+ deployed production applications on Vercel
- 🤖 Built functional RAG system with 75% relevance threshold using Groq AI + Upstash Vector

TECHNICAL EXPERTISE:
- Frontend: Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- Backend: Node.js, Express, REST APIs, Prisma ORM
- Databases: PostgreSQL, Upstash Vector, Upstash Redis
- AI/ML: RAG systems, Vector databases, LLM integration (Groq AI), Prompt engineering
- Auth: OAuth (Google), NextAuth, secure authentication patterns
- Tools: Git/GitHub, Vercel, VS Code, Chrome DevTools
- Languages: JavaScript (2y, Advanced), TypeScript (2y, Advanced), Python (5y, Intermediate), Laravel/PHP (Backend)

NOTABLE PROJECTS:
1. AI-Powered Portfolio with RAG System - Real-time professional query answering with semantic search, dual-personality modes
2. Person Search App - OAuth authentication from scratch, Prisma ORM, PostgreSQL, secure user management
3. Modern Portfolio - Dark/light themes, Framer Motion animations, 95+ Lighthouse scores
4. Movie App - Laravel/PHP backend with MySQL, demonstrating MVC architecture
5. AI Agent Dev Setup - MCP integration with Claude Desktop, 5 connected AI servers

RESPONSE GUIDELINES:
- Answer AS Niño Marcos using "I", "my", "me"
- Be CONFIDENT and CONVERSATIONAL - like talking to a recruiter over coffee
- Reference SPECIFIC DETAILS from CONTEXT - numbers, metrics, real examples
- Show personality through stories, not by listing traits
- Be honest about being a student while highlighting achievements that prove capability
- Keep it TIGHT - recruiters are busy
- If info not in context, give brief answer from core identity and pivot to what you DO know`;

export async function POST(req: Request) {
  try {
    const { messages, mood = 'professional', sessionId } = await req.json() as { 
      messages: Message[];
      mood?: AIMood;
      sessionId?: string;
    };
    
    // Get the latest user message
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content;

    // ========== LOAD SESSION HISTORY ==========
    const sessionHistory = sessionId ? await loadConversationHistory(sessionId) : [];
    const conversationContext = buildConversationContext(sessionHistory);

    // ========== STEP 0: Preprocess Query (Fix Typos) ==========
    const preprocessed = preprocessQuery(userQuery);
    const cleanQuery = preprocessed.corrected;
    
    // Log if typos were fixed
    if (preprocessed.changes.length > 0) {
      console.log(`[Typo Fix] Original: "${userQuery}" → Corrected: "${cleanQuery}" (${preprocessed.changes.join(', ')})`);
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
        return new Response(
          JSON.stringify({ 
            error: 'invalid_query',
            message: validation.reason || "Please ask about my professional background, skills, or projects."
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

    // ========== STEP 2: Check FAQ Database First ==========
    const relevantFAQs = findRelevantFAQs(cleanQuery, 2);
    let faqContext = '';
    
    if (relevantFAQs.length > 0) {
      faqContext = '\n\nFREQUENTLY ASKED (High Priority):\n' + 
        relevantFAQs.map((faq, idx) => 
          `${idx + 1}. Q: ${faq.question}\nA: ${faq.response}`
        ).join('\n\n');
    }

    // ========== STEP 3: Enhance Query for Better Vector Search ==========
    const enhancedQuery = enhanceQuery(cleanQuery);

    // ========== STEP 4: Vector Search with Enhanced RAG ==========
    const ragContext = await searchVectorContext(vectorIndex, enhancedQuery, {
      topK: 5,
      minScore: 0.75, // Balanced threshold for good coverage
      includeMetadata: true,
    });

    // Build context prompt
    let contextInfo = '';
    
    // Always include FAQ context if available (it's pre-optimized)
    if (faqContext) {
      contextInfo += '\n\n' + faqContext;
    }
    
    // Add vector search context if we have good results
    if (ragContext.chunksUsed > 0) {
      contextInfo += buildContextPrompt(ragContext);
    } else {
      // If no vector context found, add note to use core identity
      contextInfo += '\n\nNOTE: No specific vector context found. Use CORE IDENTITY information to provide a helpful answer.';
    }

    // Log relevance metrics for monitoring
    console.log(`[RAG Metrics] Query: "${cleanQuery}" | Chunks: ${ragContext.chunksUsed} | Avg Score: ${(ragContext.averageScore * 100).toFixed(1)}% | Top Score: ${(ragContext.topScore * 100).toFixed(1)}%`);

    // Handle meta queries (about the AI itself)
    if (isMetaQuery(cleanQuery)) {
      contextInfo += `\n\nMETA INFO: This is an AI digital twin built with Groq AI (llama-3.1-8b-instant), Upstash Vector for semantic search, and Next.js. It answers questions about Niño Marcos's professional background with >75% relevance accuracy.`;
    }

    // ========== STEP 5: Generate AI Response with Mood Configuration ==========
    const responseLengthGuidelines = getResponseLengthInstruction();
    const moodConfig = getMoodConfig(mood);
    
    const result = streamText({
      model: groq('llama-3.1-8b-instant'),
      system: SYSTEM_PROMPT + conversationContext + contextInfo + '\n\n' + responseLengthGuidelines + '\n\n' + moodConfig.systemPromptAddition,
      messages,
      temperature: moodConfig.temperature,
      onFinish: async ({ text }) => {
        // Save conversation history after AI responds
        if (sessionId) {
          const updatedHistory: SessionMessage[] = [
            ...sessionHistory,
            { role: 'user', content: userQuery, timestamp: Date.now(), mood },
            { role: 'assistant', content: text, timestamp: Date.now(), mood },
          ];
          
          await saveConversationHistory(sessionId, updatedHistory, mood);
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate response' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}