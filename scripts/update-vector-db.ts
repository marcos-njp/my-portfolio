/**
 * Update Upstash Vector Database with latest digitaltwin.json content
 * Run with: npx tsx scripts/update-vector-db.ts
 */

import { Index } from '@upstash/vector';
import digitalTwinData from '../data/digitaltwin.json';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const UPSTASH_VECTOR_REST_URL = process.env.UPSTASH_VECTOR_REST_URL;
const UPSTASH_VECTOR_REST_TOKEN = process.env.UPSTASH_VECTOR_REST_TOKEN;

if (!UPSTASH_VECTOR_REST_URL || !UPSTASH_VECTOR_REST_TOKEN) {
  console.error('❌ Missing Upstash Vector credentials in .env.local');
  process.exit(1);
}

interface ChunkData {
  id: string;
  title: string;
  type: string;
  content: string;
  metadata: {
    category: string;
    tags: string[];
  };
}

async function updateVectorDatabase() {
  console.log('🚀 Starting Upstash Vector DB update...\n');

  // Initialize Upstash Vector client
  const index = new Index({
    url: UPSTASH_VECTOR_REST_URL,
    token: UPSTASH_VECTOR_REST_TOKEN,
  });

  try {
    // Prepare vectors for upsert
    const vectors = digitalTwinData.content_chunks.map((chunk: ChunkData) => ({
      id: chunk.id,
      data: chunk.content, // Upstash auto-embeds this text
      metadata: {
        title: chunk.title,
        category: chunk.metadata?.category || chunk.type || 'general',
        content: chunk.content,
      },
    }));

    console.log(`📦 Preparing to upload ${vectors.length} chunks...\n`);

    // Batch upsert all vectors
    await index.upsert(vectors);

    console.log(`✅ Successfully uploaded ${vectors.length} vectors to Upstash Vector DB`);
    console.log('\n📊 Upload Summary:');
    console.log(`   Total chunks: ${vectors.length}`);
    console.log(`   Embedding model: mixedbread-ai/mxbai-embed-large-v1`);
    console.log(`   Dimensions: 1024`);
    console.log(`   Similarity: Cosine`);
    console.log('\n✨ Vector database updated with tone-fixed content!');

  } catch (error) {
    console.error('❌ Error updating vector database:', error);
    process.exit(1);
  }
}

updateVectorDatabase();
