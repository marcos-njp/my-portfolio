// Script to seed the Upstash Vector Database with portfolio embeddings
// Run this once: node --loader ts-node/esm scripts/seed-embeddings.ts
// Or add to package.json: "seed": "tsx scripts/seed-embeddings.ts"

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

import { seedVectorDatabase } from '../lib/embeddings';

async function main() {
  console.log('🚀 Starting embeddings seed process...\n');
  
  // Check for required environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY not found in .env file');
    process.exit(1);
  }
  
  if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
    console.error('❌ Error: Upstash Vector credentials not found in .env file');
    process.exit(1);
  }

  try {
    const result = await seedVectorDatabase();
    console.log('\n✅ Success!');
    console.log(`📊 Embedded ${result.count} portfolio documents`);
    console.log('\n🎉 Vector database is ready for RAG queries!');
  } catch (error) {
    console.error('\n❌ Failed to seed embeddings:', error);
    process.exit(1);
  }
}

main();
