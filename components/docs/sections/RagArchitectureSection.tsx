import { Code2, Database, Zap, GitBranch, Settings, CheckCircle } from "lucide-react";

export function RagArchitectureSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">RAG Architecture</h1>
        <p className="text-xl text-muted-foreground">
          Technical deep dive into the Retrieval-Augmented Generation system powering the AI digital twin.
        </p>
      </div>

      {/* System Overview */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-6 h-6" />
          System Overview
        </h2>
        <div className="rounded-lg border p-6 space-y-4">
          <p>
            The RAG system combines real-time vector search with large language model generation to provide accurate, 
            context-aware responses about professional background, skills, and experience.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-md bg-muted p-4">
              <h3 className="font-semibold mb-2">AI Model</h3>
              <p className="text-sm text-muted-foreground">Groq AI (llama-3.1-8b-instant)</p>
              <p className="text-xs text-muted-foreground mt-1">Fast inference, streaming support</p>
            </div>
            <div className="rounded-md bg-muted p-4">
              <h3 className="font-semibold mb-2">Vector Database</h3>
              <p className="text-sm text-muted-foreground">Upstash Vector</p>
              <p className="text-xs text-muted-foreground mt-1">Serverless, low-latency semantic search</p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Flow */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <GitBranch className="w-6 h-6" />
          Request Flow
        </h2>
        <div className="rounded-lg border p-6">
          <ol className="space-y-4">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                1
              </span>
              <div>
                <h3 className="font-semibold">Query Preprocessing</h3>
                <p className="text-sm text-muted-foreground">
                  Typo correction, fuzzy matching, and query normalization for better search accuracy.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                2
              </span>
              <div>
                <h3 className="font-semibold">Query Validation</h3>
                <p className="text-sm text-muted-foreground">
                  Category detection (projects, skills, experience) and context validation to ensure professional relevance.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                3
              </span>
              <div>
                <h3 className="font-semibold">Vector Search</h3>
                <p className="text-sm text-muted-foreground">
                  Semantic search in Upstash Vector with topK=2-3, minScore=0.75 (75% relevance threshold) with 0.65 fallback for top-2 results if no matches meet primary threshold.
                </p>
                <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
                  const results = await vectorIndex.query(embedding, &#123; topK: 3, minScore: 0.75 &#125;)
                </code>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                4
              </span>
              <div>
                <h3 className="font-semibold">Context Building</h3>
                <p className="text-sm text-muted-foreground">
                  Retrieved chunks + conversation history + FAQ patterns combined into rich context prompt.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                5
              </span>
              <div>
                <h3 className="font-semibold">AI Generation</h3>
                <p className="text-sm text-muted-foreground">
                  Groq AI generates response with streaming, temperature-controlled based on mood (0.7 professional, 0.9 genz).
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Vector Database */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Database className="w-6 h-6" />
          Vector Database Structure
        </h2>
        <div className="space-y-4">
          <div className="rounded-lg border p-6">
            <h3 className="font-semibold mb-3">Knowledge Base Organization</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">38 Embedded Chunks</p>
                  <p className="text-muted-foreground">Professional profile data split into semantic chunks from digitaltwin.json</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">STAR Methodology</p>
                  <p className="text-muted-foreground">Achievements structured as Situation, Task, Action, Result for detailed context</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Metadata Enrichment</p>
                  <p className="text-muted-foreground">Categories, tags, and relevance scores for precise retrieval</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-6">
            <h3 className="font-semibold mb-3">Search Configuration</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground mb-1">Top-K Results</p>
                <p className="text-lg font-semibold">3 chunks</p>
                <p className="text-xs text-muted-foreground">Most relevant contexts</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground mb-1">Min Score Threshold</p>
                <p className="text-lg font-semibold">0.75 (75%)</p>
                <p className="text-xs text-muted-foreground">Primary threshold, 0.65 fallback</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground mb-1">Average Score</p>
                <p className="text-lg font-semibold">~80%</p>
                <p className="text-xs text-muted-foreground">Typical relevance</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground mb-1">Response Time</p>
                <p className="text-lg font-semibold">&lt;3s</p>
                <p className="text-xs text-muted-foreground">End-to-end latency</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Streaming Implementation */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6" />
          Streaming Responses
        </h2>
        <div className="rounded-lg border p-6 space-y-4">
          <p>
            Real-time response streaming using Vercel AI SDK and Groq AI's streaming API for immediate user feedback.
          </p>
          <div className="rounded-md bg-muted p-4">
            <code className="text-sm">
              <pre className="overflow-x-auto">{`const result = streamText({
  model: groq('llama-3.1-8b-instant'),
  system: finalSystemPrompt,
  messages,
  temperature: moodConfig.temperature,
  onFinish: async ({ text }) => {
    // Save to session memory
    await saveConversationHistory(sessionId, updatedHistory);
  }
});`}</pre>
            </code>
          </div>
          <ul className="space-y-2 text-sm list-disc list-inside text-muted-foreground">
            <li>Progressive loading states: "Thinking..." → "Processing..." → "Almost there...", with 12s timeout fallback</li>
            <li>Progressive rendering with loading indicators</li>
            <li>AbortController for clean request cancellation</li>
            <li>Error boundaries for graceful degradation</li>
          </ul>
        </div>
      </section>

      {/* Performance Metrics */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Code2 className="w-6 h-6" />
          Performance Optimization
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground mb-1">Token Usage</p>
            <p className="text-2xl font-bold">1k-2.5k</p>
            <p className="text-xs text-green-600">↓From 1.5k-3k (optimized)</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground mb-1">RAG Accuracy</p>
            <p className="text-2xl font-bold">75%</p>
            <p className="text-xs text-muted-foreground">Average relevance (threshold)</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground mb-1">Cache Hit Rate</p>
            <p className="text-2xl font-bold">Redis</p>
            <p className="text-xs text-muted-foreground">Session persistence</p>
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Implementation Example</h2>
        <div className="rounded-lg border p-6">
          <pre className="text-sm overflow-x-auto"><code>{`// Vector search with Upstash
const ragContext = await searchVectorContext(vectorIndex, enhancedQuery, {
  topK: 3,
  minScore: 0.75,
  includeMetadata: true,
});

// Build context from retrieved chunks
const contextInfo = buildContextPrompt(ragContext);

// Generate AI response with context
const result = streamText({
  model: groq('llama-3.1-8b-instant'),
  system: SYSTEM_PROMPT + conversationContext + contextInfo,
  messages,
  temperature: 0.7,
});`}</code></pre>
        </div>
      </section>
    </div>
  );
}
