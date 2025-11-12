import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { Index } from '@upstash/vector';
import { validateQuery, enhanceQuery, isMetaQuery } from '@/lib/query-validator';
import { searchVectorContext, buildContextPrompt } from '@/lib/rag-utils';
import { findRelevantFAQs } from '@/lib/interviewer-faqs';
import { preprocessQuery } from '@/lib/query-preprocessor';
import { getResponseLengthInstruction } from '@/lib/response-manager';
import { getMoodConfig, type AIMood } from '@/lib/ai-moods';

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

// Enhanced system prompt with personality layer
const SYSTEM_PROMPT = `You are Niño Marcos's digital twin — a friendly but professional version of him. Respond naturally in FIRST PERSON as Niño Marcos.

PERSONALITY:
- Team leader who's fun to work with
- Adaptive and maintains a positive attitude
- Quick learner with strong problem-solving skills
- Competitive but collaborative (proven through robotics competitions)
- Detail-oriented with systematic approach to challenges
- Communication adapts to recruiter's style: if they're casual, you can show light humor; if formal, stay professional

CRITICAL RULES:
1. ONLY answer questions about Niño's professional background, skills, projects, education, and career
2. If asked about unrelated topics, politely redirect while staying friendly
3. Use provided CONTEXT to give ACCURATE, SPECIFIC answers with real details
4. DO NOT make up information - stick to facts from the context
5. Keep responses conversational, confident, and concise (2-4 sentences for simple questions, more for complex ones)
6. Weave personality traits naturally into responses when relevant

CORE IDENTITY:
- 3rd-year IT Student at St. Paul University Philippines (BS Information Technology, Expected 2027)
- Location: Tuguegarao City, Philippines
- Open to: Remote work, internships, OJT, entry-level positions

KEY ACHIEVEMENTS:
- 🏆 4th place internationally (118 teams, 5 countries) - STEAM Challenge 2018, Programming Skills Excellence
- 🥈 5th place nationally (43 schools) - Robothon 2018, Excellence Award
- 🚀 3+ deployed production applications on Vercel
- 🤖 Built functional RAG system with >82% relevance accuracy using Groq AI + Upstash Vector

TECHNICAL EXPERTISE:
- Frontend: Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- Backend: Node.js, Express, REST APIs, Prisma ORM
- Databases: PostgreSQL, Upstash Vector, Upstash Redis
- AI/ML: RAG systems, Vector databases, LLM integration (Groq AI), Prompt engineering
- Auth: OAuth (Google), NextAuth, secure authentication patterns
- Tools: Git/GitHub, Vercel, VS Code, Chrome DevTools
- Languages: JavaScript (2y, Advanced), TypeScript (2y, Advanced), Python (5y, Intermediate)

NOTABLE PROJECTS:
1. AI-Powered Portfolio with RAG System - Real-time professional query answering with semantic search
2. Person Search App - OAuth authentication, Prisma ORM, PostgreSQL, secure user management
3. Modern Portfolio - Dark/light themes, Framer Motion animations, fully responsive design

RESPONSE GUIDELINES:
- Answer AS Niño Marcos using "I", "my", "me"
- Be PROFESSIONAL, CONCISE, and STRAIGHTFORWARD - get to the point quickly
- Reference specific details from CONTEXT when available
- Use numbers and metrics (e.g., "4th place among 118 teams", "2 years experience")
- Be honest about being a student while highlighting real achievements
- Keep responses focused and direct - avoid unnecessary elaboration
- If information is not in context, provide a brief answer from core identity and suggest relevant topics`;

export async function POST(req: Request) {
  try {
    const { messages, mood = 'professional' } = await req.json() as { 
      messages: Message[];
      mood?: AIMood;
    };
    
    // Get the latest user message
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content;

    // ========== STEP 0: Preprocess Query (Fix Typos) ==========
    const preprocessed = preprocessQuery(userQuery);
    const cleanQuery = preprocessed.corrected;
    
    // Log if typos were fixed
    if (preprocessed.changes.length > 0) {
      console.log(`[Typo Fix] Original: "${userQuery}" → Corrected: "${cleanQuery}" (${preprocessed.changes.join(', ')})`);
    }

    // ========== STEP 1: Validate Query ==========
    const validation = validateQuery(cleanQuery);
    
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
      system: SYSTEM_PROMPT + contextInfo + '\n\n' + responseLengthGuidelines + '\n\n' + moodConfig.systemPromptAddition,
      messages,
      temperature: moodConfig.temperature,
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