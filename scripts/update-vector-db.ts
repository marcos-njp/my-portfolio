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
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const UPSTASH_VECTOR_REST_URL = process.env.UPSTASH_VECTOR_REST_URL;
const UPSTASH_VECTOR_REST_TOKEN = process.env.UPSTASH_VECTOR_REST_TOKEN;

if (!UPSTASH_VECTOR_REST_URL || !UPSTASH_VECTOR_REST_TOKEN) {
  console.error('Missing Upstash Vector credentials in .env.local');
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
  console.log('Starting Upstash Vector DB update...\n');

  // Initialize Upstash Vector client
  const index = new Index({
    url: UPSTASH_VECTOR_REST_URL,
    token: UPSTASH_VECTOR_REST_TOKEN,
  });

  try {
    const chunks = digitalTwinData.content_chunks as ChunkData[];

    // The index has a hosted embedding model, so Upstash embeds `data` on upsert.
    const vectors = chunks.map(chunk => ({
      id: chunk.id,
      data: chunk.content,
      metadata: {
        title: chunk.title,
        category: chunk.metadata?.category || chunk.type || 'general',
        content: chunk.content,
      },
    }));

    console.log(`Preparing to upload ${vectors.length} chunks...\n`);

    // Clear existing vectors first so removed/renamed chunks don't linger.
    // (upsert alone only adds or overwrites by id, it never deletes.)
    await index.reset();
    console.log('Cleared existing vectors.');

    // Batch upsert all vectors
    await index.upsert(vectors);

    console.log(`Successfully uploaded ${vectors.length} vectors to Upstash Vector DB`);
    console.log('\nUpload Summary:');
    console.log(`   Total chunks: ${vectors.length}`);
    console.log(`   Embedding model: text-embedding-3-small (Upstash hosted)`);
    console.log(`   Dimensions: 1536`);
    console.log(`   Similarity: Cosine`);
    console.log('\nVector database updated with enhanced content including personality traits!');

  } catch (error) {
    console.error('Error updating vector database:', error);
    process.exit(1);
  }
}

updateVectorDatabase();
