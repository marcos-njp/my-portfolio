import { AlertCircle, GitCommit, Wrench, CheckCircle, AlertTriangle, Code } from "lucide-react";
import { TroubleshootCard, InfoBox, CodeBlock } from "@/components/docs";

export function OperationsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">Operations & Troubleshooting</h1>
        <p className="text-xl text-muted-foreground">
          Real-world challenges and solutions from development journey, documented through Git commit history.
        </p>
      </div>

      {/* Overview */}
      <section>
        <InfoBox variant="muted">
          <p>
            This operations guide captures actual troubleshooting scenarios encountered during development. 
            Each issue includes context, diagnosis, solution, and prevention strategies derived from 
            commit messages and pull requests in the{" "}
            <a 
              href="https://github.com/marcos-njp/my-portfolio-main-project/commits/main/" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              project repository
            </a>.
          </p>
        </InfoBox>
      </section>

      {/* MCP Connectivity */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-6 h-6" />
          MCP Connectivity Issues
        </h2>
        <div className="space-y-4">
          <TroubleshootCard
            problem="MCP Server Not Responding"
            description="Claude Desktop failed to connect to MCP endpoint, returning timeout errors"
            diagnosis={[
              "Initial local testing used http://localhost:3000/api/mcp",
              "After deployment, needed to update to https://m-njp.vercel.app/api/mcp",
              "Claude Desktop config still pointed to localhost",
              "Root cause: Forgot to update MCP server URL in claude_desktop_config.json"
            ]}
            solution={
              <CodeBlock language="json">{`// claude_desktop_config.json - Updated URL
{
  "mcpServers": {
    "my-mcp-server": {
      "url": "https://m-njp.vercel.app/api/mcp",
      "transport": "http"
    }
  }
}`}</CodeBlock>
            }
            prevention="Always update MCP client configuration when switching from local development to production deployment. Test connectivity with curl/Postman to verify endpoint is accessible."
          />

          <TroubleshootCard
            problem="Invalid Mood Enum Value"
            description="MCP tool validation failed with 'mood must be professional or genz or casual'"
            diagnosis={[
              "Zod schema in lib/chat-mcp.ts included 'casual' mood",
              "lib/ai-moods.ts only exported 'professional' and 'genz'",
              "Mismatch caused validation errors when MCP tried to use 'casual'"
            ]}
            solution={
              <CodeBlock language="typescript">{`// lib/chat-mcp.ts - Updated Zod schema
mood: z.enum(['professional', 'genz']).default('professional')

// app/api/[transport]/route.ts - Fixed enum
const validMoods = ['professional', 'genz'] as const;`}</CodeBlock>
            }
            prevention="Maintain single source of truth for enums. Use TypeScript const assertions and derive Zod schemas from type definitions."
          />
        </div>
      </section>

      {/* RAG Threshold Issues */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Wrench className="w-6 h-6" />
          RAG Performance Tuning
        </h2>
        <TroubleshootCard
          problem="Irrelevant Context in Responses"
          description="AI included unrelated information when answering specific questions"
          diagnosis={
            <>
              <p className="text-muted-foreground mb-2">
                Initial minScore threshold was 0.4 (40%), allowing low-relevance chunks into context
              </p>
              <CodeBlock language="text">{`Query: "What databases do you use?"
Retrieved chunks:
- Score 0.85: "Upstash Vector and Redis for AI system..." ✅
- Score 0.78: "PostgreSQL in e-commerce projects..." ✅
- Score 0.42: "Handled authentication with OAuth..." ❌ Irrelevant`}</CodeBlock>
            </>
          }
          solution={
            <div className="space-y-3">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Increased minScore from 0.4 to 0.75 (75% threshold) with 0.65 fallback</li>
                <li>Tested with 20+ sample queries to validate quality improvement</li>
                <li>Average relevance score improved from ~65% to ~75%</li>
              </ul>
              <div>
                <p className="font-medium text-sm mb-2">Monitoring:</p>
                <CodeBlock language="typescript">{`// Added logging in lib/rag-utils.ts
console.log('RAG Search Results:', {
  query: enhancedQuery,
  resultsCount: results.length,
  avgScore: avgScore.toFixed(2),
  minScore: Math.min(...scores).toFixed(2),
  maxScore: Math.max(...scores).toFixed(2)
});`}</CodeBlock>
              </div>
            </div>
          }
          prevention="Monitor RAG scores regularly and adjust thresholds based on actual query patterns. Test with diverse sample queries before deploying threshold changes."
        />
      </section>

      {/* Conversation Context */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Code className="w-6 h-6" />
          Conversation Context Improvements
        </h2>
        <TroubleshootCard
          problem="Follow-up Questions Failed"
          description="AI couldn't understand pronouns like 'it', 'them', 'that' in follow-up questions"
          diagnosis={
            <div>
              <p className="font-medium mb-2">Example Failure:</p>
              <CodeBlock language="text">{`User: "Tell me about your AI projects"
AI: "I built an AI-Powered Portfolio with Next.js 15..."
User: "What are the tech stacks of it?"
AI: "I can answer questions about my projects..." ❌ Generic response`}</CodeBlock>
            </div>
          }
          solution={
            <div className="space-y-3">
              <p className="font-medium mb-2">Solution Implemented:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  <strong>Enhanced Session Memory:</strong> Added CRITICAL FOLLOW-UP RULES to lib/session-memory.ts
                </li>
                <li>
                  <strong>System Prompt Examples:</strong> Added bad/good examples in app/api/chat/route.ts
                </li>
                <li>
                  <strong>Context Priority:</strong> Check conversation history BEFORE RAG retrieval
                </li>
                <li>
                  <strong>Redis Persistence:</strong> Maintain 16 messages (8 exchanges) for context
                </li>
              </ol>
              <div className="mt-3">
                <p className="font-medium mb-2">Result:</p>
                <CodeBlock language="text">{`User: "Tell me about your AI projects"
AI: "I built an AI-Powered Portfolio with Next.js 15..."
User: "What are the tech stacks of it?"
AI: "The AI-Powered Portfolio uses Next.js 15, TypeScript, 
     Groq AI, Upstash Vector..." ✅ Specific response`}</CodeBlock>
              </div>
            </div>
          }
          prevention="Always maintain conversation history in session memory. Provide explicit examples in system prompts showing how to handle pronouns and contextual references."
        />
      </section>

      {/* Token Optimization */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <GitCommit className="w-6 h-6" />
          Token Usage Optimization
        </h2>
        <div className="space-y-4">
          <TroubleshootCard
            problem="High Token Consumption"
            description="Token usage ranged from 1k-3.5k per request, impacting cost and latency"
            diagnosis={
              <div>
                <p className="font-medium mb-2">Token Breakdown Before:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Professional mood prompt: ~1,200 characters</li>
                  <li>GenZ mood prompt: ~2,800 characters (verbose examples)</li>
                  <li>50+ hardcoded FAQ responses in context</li>
                  <li>Total: 1k-3.5k tokens per request</li>
                </ul>
              </div>
            }
            solution={
              <div className="space-y-3">
                <p className="font-medium mb-2">Optimizations Applied:</p>
                <div className="space-y-2 text-sm">
                  <p><strong>1. Mood Prompt Reduction:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Professional: 1,200 → 400 chars (↓67%)</li>
                    <li>GenZ: 2,800 → 600 chars (↓79%)</li>
                  </ul>
                  <p className="mt-2"><strong>2. FAQ System Refactor:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Replaced 50+ hardcoded responses with 10 context hint patterns</li>
                    <li>Dynamic generation instead of fixed strings</li>
                  </ul>
                  <p className="mt-2"><strong>3. Pattern Simplification:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Feedback detector: 9 patterns → 4 patterns (↓50%)</li>
                    <li>Response validator: Array filter → Set lookup (O(1))</li>
                  </ul>
                </div>
                <div className="mt-3">
                  <p className="font-medium mb-2">Impact:</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Before:</p>
                      <p className="text-2xl font-bold">1k-3.5k</p>
                      <p className="text-muted-foreground">tokens/request</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">After:</p>
                      <p className="text-2xl font-bold text-green-600">600-2k</p>
                      <p className="text-muted-foreground">tokens/request ↓40%</p>
                    </div>
                  </div>
                </div>
              </div>
            }
            prevention="Monitor token usage regularly with logging. Keep prompts concise and use dynamic context hints instead of hardcoded responses. Optimize pattern matching with efficient data structures."
          />
        </div>
      </section>

      {/* Best Practices */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-6 h-6" />
          Best Practices Learned
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-3 text-sm">Development</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                <span>Test API routes with curl/Postman before deployment</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                <span>Implement CORS headers for external API access</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                <span>Maintain single source of truth for type definitions</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                <span>Add comprehensive logging for debugging production issues</span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-3 text-sm">AI Systems</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                <span>Tune RAG thresholds with real queries, not assumptions</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                <span>Provide explicit examples in system prompts (bad vs good)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                <span>Monitor token usage and optimize prompts regularly</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                <span>Use context hints instead of hardcoded responses for flexibility</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Monitoring */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Ongoing Monitoring</h2>
        <div className="rounded-lg border p-6">
          <p className="text-sm text-muted-foreground mb-4">
            Current monitoring setup for proactive issue detection:
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-md bg-muted p-3">
              <p className="font-medium mb-1">Vercel Logs</p>
              <p className="text-xs text-muted-foreground">Real-time API request/response tracking</p>
            </div>
            <div className="rounded-md bg-muted p-3">
              <p className="font-medium mb-1">Token Estimation</p>
              <p className="text-xs text-muted-foreground">Console logging for usage patterns</p>
            </div>
            <div className="rounded-md bg-muted p-3">
              <p className="font-medium mb-1">RAG Scores</p>
              <p className="text-xs text-muted-foreground">Context relevance quality metrics</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

