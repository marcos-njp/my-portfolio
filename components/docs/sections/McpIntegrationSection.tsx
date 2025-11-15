import { Plug, Server, Code, CheckCircle, ExternalLink, Terminal } from "lucide-react";

export function McpIntegrationSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">MCP Integration</h1>
        <p className="text-xl text-muted-foreground">
          Model Context Protocol implementation enabling AI agents to interact with the digital twin seamlessly.
        </p>
      </div>

      {/* Overview */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Plug className="w-6 h-6" />
          What is MCP?
        </h2>
        <div className="rounded-lg border p-6 space-y-4">
          <p>
            The Model Context Protocol (MCP) is an open standard that enables AI applications to communicate with 
            external data sources and tools. This integration allows Claude Desktop and other MCP-compatible clients 
            to query the digital twin portfolio directly.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="rounded-md bg-muted p-4">
              <h3 className="font-semibold mb-2">Protocol</h3>
              <p className="text-sm text-muted-foreground">HTTP Transport</p>
              <p className="text-xs text-muted-foreground mt-1">RESTful communication</p>
            </div>
            <div className="rounded-md bg-muted p-4">
              <h3 className="font-semibold mb-2">Endpoint</h3>
              <p className="text-sm text-muted-foreground break-all">
                /api/mcp
              </p>
              <p className="text-xs text-muted-foreground mt-1">Single route handler</p>
            </div>
            <div className="rounded-md bg-muted p-4">
              <h3 className="font-semibold mb-2">Deployment</h3>
              <p className="text-sm text-muted-foreground">Vercel Edge</p>
              <p className="text-xs text-muted-foreground mt-1">Global distribution</p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Server className="w-6 h-6" />
          MCP Server Architecture
        </h2>
        <div className="rounded-lg border p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                1
              </span>
              <div>
                <h3 className="font-semibold">Client Request</h3>
                <p className="text-sm text-muted-foreground">
                  Claude Desktop or other MCP client sends HTTP POST to <code className="text-xs bg-muted px-1 py-0.5 rounded">https://m-njp.vercel.app/api/mcp</code>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                2
              </span>
              <div>
                <h3 className="font-semibold">Transport Layer</h3>
                <p className="text-sm text-muted-foreground">
                  MCP handler validates request format, extracts tool calls, and forwards to chat API
                </p>
                <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
                  app/api/[transport]/route.ts
                </code>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                3
              </span>
              <div>
                <h3 className="font-semibold">Chat Processing</h3>
                <p className="text-sm text-muted-foreground">
                  Standard chat route processes request with RAG, session memory, and mood configuration
                </p>
                <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
                  app/api/chat/route.ts
                </code>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                4
              </span>
              <div>
                <h3 className="font-semibold">Response Streaming</h3>
                <p className="text-sm text-muted-foreground">
                  AI-generated response streams back through MCP transport to client
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tool Definition */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Code className="w-6 h-6" />
          Tool Definition
        </h2>
        <div className="space-y-4">
          <div className="rounded-lg border p-6">
            <h3 className="font-semibold mb-3">chat_with_digital_twin Tool</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Primary MCP tool that allows AI agents to query the digital twin about professional background, 
              skills, projects, and experience.
            </p>
            
            <div className="rounded-md bg-muted p-4 mb-4">
              <pre className="text-xs overflow-x-auto"><code>{`{
  name: "chat_with_digital_twin",
  description: "Chat with Niño Marcos digital twin to learn about 
    professional background, skills, projects, and experience.",
  inputSchema: {
    message: string,      // Required: User query
    mood: enum,          // Optional: 'professional' | 'genz'
    sessionId: string    // Optional: Conversation tracking
  }
}`}</code></pre>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium mb-2">Supported Moods</p>
                <div className="space-y-2">
                  <div className="rounded-md border-2 border-blue-500 dark:border-blue-400 p-2">
                    <p className="font-medium text-blue-700 dark:text-blue-300">professional</p>
                    <p className="text-xs text-muted-foreground">Formal business responses</p>
                  </div>
                  <div className="rounded-md border-2 border-purple-500 dark:border-purple-400 p-2">
                    <p className="font-medium text-purple-700 dark:text-purple-300">genz</p>
                    <p className="text-xs text-muted-foreground">Casual, relatable tone</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-medium mb-2">Features</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Session persistence</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>RAG-powered context</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Streaming responses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Follow-up awareness</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-6">
            <h3 className="font-semibold mb-3">Zod Schema Validation</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Type-safe input validation using Zod ensures data integrity.
            </p>
            <div className="rounded-md bg-muted p-4">
              <pre className="text-xs overflow-x-auto"><code>{`const chatInputSchema = z.object({
  message: z.string()
    .min(1, "Message cannot be empty")
    .max(1000, "Message too long"),
  mood: z.enum(['professional', 'genz'])
    .default('professional'),
  sessionId: z.string().optional()
});`}</code></pre>
            </div>
            <code className="text-xs bg-muted px-2 py-1 rounded mt-3 inline-block">
              lib/chat-mcp.ts
            </code>
          </div>
        </div>
      </section>

      {/* Claude Desktop Setup */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Terminal className="w-6 h-6" />
          Claude Desktop Configuration
        </h2>
        <div className="rounded-lg border p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure Claude Desktop to connect to the MCP server by adding the configuration to 
            <code className="text-xs bg-muted px-1 py-0.5 rounded mx-1">claude_desktop_config.json</code>
          </p>

          <div className="rounded-md bg-muted p-4">
            <pre className="text-xs overflow-x-auto"><code>{`{
  "mcpServers": {
    "my-mcp-server": {
      "url": "https://m-njp.vercel.app/api/mcp",
      "transport": "http"
    }
  }
}`}</code></pre>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-medium">Configuration Location:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>
                <strong>Windows:</strong> <code className="text-xs bg-muted px-1 py-0.5 rounded">%APPDATA%\Claude\claude_desktop_config.json</code>
              </li>
              <li>
                <strong>macOS:</strong> <code className="text-xs bg-muted px-1 py-0.5 rounded">~/Library/Application Support/Claude/claude_desktop_config.json</code>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Production Deployment */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Production Deployment</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border p-6">
            <h3 className="font-semibold mb-3">Vercel Edge Runtime</h3>
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Deployed on Vercel Edge network for global low-latency access.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cold Start:</span>
                  <span className="font-semibold">&lt;100ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timeout:</span>
                  <span className="font-semibold">60s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Region:</span>
                  <span className="font-semibold">Global Edge</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-6">
            <h3 className="font-semibold mb-3">Environment Variables</h3>
            <div className="space-y-2 text-xs">
              <code className="block rounded-md bg-muted p-2">GROQ_API_KEY</code>
              <code className="block rounded-md bg-muted p-2">UPSTASH_VECTOR_REST_URL</code>
              <code className="block rounded-md bg-muted p-2">UPSTASH_VECTOR_REST_TOKEN</code>
              <code className="block rounded-md bg-muted p-2">UPSTASH_REDIS_REST_URL</code>
              <code className="block rounded-md bg-muted p-2">UPSTASH_REDIS_REST_TOKEN</code>
            </div>
          </div>
        </div>
      </section>

      {/* Testing & Usage */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Testing & Usage</h2>
        <div className="space-y-4">
          <div className="rounded-lg border p-6">
            <h3 className="font-semibold mb-3">Example MCP Request</h3>
            <div className="rounded-md bg-muted p-4">
              <pre className="text-xs overflow-x-auto"><code>{`POST https://m-njp.vercel.app/api/mcp
Content-Type: application/json

{
  "tool": "chat_with_digital_twin",
  "arguments": {
    "message": "What are your key technical skills?",
    "mood": "professional",
    "sessionId": "session_123"
  }
}`}</code></pre>
            </div>
          </div>

          <div className="rounded-lg border p-6">
            <h3 className="font-semibold mb-3">Expected Response</h3>
            <div className="rounded-md bg-muted p-4">
              <pre className="text-xs overflow-x-auto"><code>{`{
  "content": [
    {
      "type": "text",
      "text": "I specialize in full-stack development with 
        expertise in Next.js 15, React, TypeScript..."
    }
  ]
}`}</code></pre>
            </div>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Resources</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <a
            href="https://github.com/marcos-njp/my-portfolio-main-project"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border p-4 hover:border-primary transition-colors flex items-center justify-between group"
          >
            <div>
              <p className="font-semibold flex items-center gap-2">
                <Code className="w-4 h-4" />
                Source Code
              </p>
              <p className="text-sm text-muted-foreground">View implementation on GitHub</p>
            </div>
            <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
          </a>

          <a
            href="https://modelcontextprotocol.io"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border p-4 hover:border-primary transition-colors flex items-center justify-between group"
          >
            <div>
              <p className="font-semibold flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                MCP Documentation
              </p>
              <p className="text-sm text-muted-foreground">Official MCP protocol docs</p>
            </div>
            <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
          </a>
        </div>
      </section>
    </div>
  );
}
