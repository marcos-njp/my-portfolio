import { Index } from '@upstash/vector';
import { portfolioContent } from './portfolio-content';

const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

interface EmbeddingMetadata {
  category: string;
  title: string;
  text: string;
}

/**
 * Generate embeddings using OpenAI and upsert to Upstash Vector DB
 * Run this once to populate the vector database with portfolio content
 */
export async function seedVectorDatabase() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  console.log('Starting vector database seeding...');
  console.log(`Total documents to embed: ${portfolioContent.length}`);

  try {
    // Generate embeddings for all portfolio content
    for (let i = 0; i < portfolioContent.length; i++) {
      const item = portfolioContent[i];
      console.log(`Processing ${i + 1}/${portfolioContent.length}: ${item.title}`);

      // Call OpenAI Embeddings API
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          input: item.text,
          model: 'text-embedding-3-small', // 1536 dimensions, cost-effective
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
      }

      const data = await response.json();
      const embedding = data.data[0].embedding;

      // Upsert to Upstash Vector with metadata
      await vectorIndex.upsert({
        id: `portfolio-${item.category}-${i}`,
        vector: embedding,
        metadata: {
          category: item.category,
          title: item.title,
          text: item.text,
        },
      });

      console.log(`✓ Embedded and stored: ${item.title}`);

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('✅ Vector database seeding completed successfully!');
    
    // Verify by checking index stats
    const stats = await vectorIndex.info();
    console.log('Index stats:', stats);
    
    return { success: true, count: portfolioContent.length };
  } catch (error) {
    console.error('Error seeding vector database:', error);
    throw error;
  }
}

/**
 * Query the vector database for relevant context
 * @param query - User's question
 * @param topK - Number of results to return (default: 5)
 */
export async function queryVectorDatabase(query: string, topK: number = 5) {
  try {
    // Generate embedding for the query
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: query,
        model: 'text-embedding-3-small',
      }),
    });

    const data = await response.json();
    const queryEmbedding = data.data[0].embedding;

    // Search vector database
    const results = await vectorIndex.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });

    return results.map((result) => ({
      score: result.score,
      category: result.metadata?.category,
      title: result.metadata?.title,
      text: result.metadata?.text,
    }));
  } catch (error) {
    console.error('Error querying vector database:', error);
    return [];
  }
}

/**
 * Reset the vector database (delete all vectors)
 */
export async function resetVectorDatabase() {
  try {
    console.log('Resetting vector database...');
    await vectorIndex.reset();
    console.log('✅ Vector database reset complete');
  } catch (error) {
    console.error('Error resetting vector database:', error);
    throw error;
  }
}
