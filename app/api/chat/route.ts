import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { Index } from '@upstash/vector';

// Initialize Upstash Vector index
const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

// System prompt defining the assistant's behavior
const SYSTEM_PROMPT = `You are a helpful AI assistant for Niño Marcos' portfolio website. 
You help visitors learn about Niño's background, skills, projects, and experience.

Guidelines:
- Be friendly, professional, and concise
- Use the provided context to answer questions accurately
- If asked about something not in the context, politely say you don't have that information
- Focus on highlighting Niño's strengths and accomplishments
- Encourage visitors to check out his projects and contact him

Context about Niño will be provided with each query.`;

export async function POST(req: Request) {
  try {
    const { messages, model = 'gpt-4o-mini' } = await req.json();

    // Get the last user message for RAG query
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content;

    // Query Upstash Vector for relevant context
    // Note: This will work once embeddings are set up
    let context = '';
    try {
      // First, we need to embed the user's query using OpenAI
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          input: userQuery,
          model: 'text-embedding-3-small',
        }),
      });

      const embeddingData = await embeddingResponse.json();
      const queryEmbedding = embeddingData.data[0].embedding;

      // Query vector database for similar content
      const results = await vectorIndex.query({
        vector: queryEmbedding,
        topK: 5,
        includeMetadata: true,
      });

      // Build context from retrieved documents
      if (results.length > 0) {
        context = results
          .map((result) => result.metadata?.text || '')
          .filter(Boolean)
          .join('\n\n');
      }
    } catch (error) {
      console.error('Error querying vector database:', error);
      // Continue without context if vector search fails
    }

    // Prepare messages with context
    const enhancedMessages = [
      {
        role: 'system' as const,
        content: context
          ? `${SYSTEM_PROMPT}\n\nRelevant context:\n${context}`
          : SYSTEM_PROMPT,
      },
      ...messages,
    ];

    // Stream response using Vercel AI SDK
    const result = streamText({
      model: openai(model),
      messages: enhancedMessages,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
