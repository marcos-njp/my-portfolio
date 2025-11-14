// app/api/[transport]/route.ts
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { chatTool } from "@/lib/chat-mcp";
import { resolveApiDomain } from "@/lib/url-resolver";

// Vercel Node.js Runtime for better SSE support and longer timeouts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Define schema inline without chained optional/default
const chatParamsShape = {
  message: z.string().min(1).max(1000),
  mood: z.enum(['professional', 'casual', 'genz']).optional(),
  sessionId: z.string().optional(),
};

// Log to stderr (shows in Vercel logs and Claude Desktop)
const log = (...args: any[]) => console.error('[MCP Server]', ...args);

const handler = createMcpHandler(
  (server) => {
    log('Registering chat tool...');
    
    server.tool(
      chatTool.name,
      chatTool.description,
      chatParamsShape,
      async ({ message, mood, sessionId }) => {
        log(`Chat request: "${message.substring(0, 50)}...", mood=${mood || 'professional'}`);
        
        // Set defaults for optional parameters
        const actualMood = mood || 'professional';
        const actualSessionId = sessionId || undefined;
        
        try {
          // Call the existing chat API route
          const apiDomain = resolveApiDomain();
          log(`Calling chat API at ${apiDomain}/api/chat`);
          
          const response = await fetch(`${apiDomain}/api/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [{ role: 'user', content: message }],
              mood: actualMood,
              sessionId: actualSessionId,
            }),
            signal: AbortSignal.timeout(55000), // 55s timeout (under 60s max)
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Unknown error' }));
            log(`Chat API error:`, error);
            throw new Error(error.message || `Chat API returned ${response.status}`);
          }

          // Read the streaming response
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let fullResponse = '';

          if (reader) {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                fullResponse += decoder.decode(value, { stream: true });
              }
            } finally {
              reader.releaseLock();
            }
          }

          log(`Response received, length: ${fullResponse.length} chars`);
          
          return {
            content: [{
              type: 'text' as const,
              text: fullResponse || 'No response received from AI',
            }],
          };
        } catch (error) {
          log(`Tool error:`, error);
          
          if (error instanceof Error) {
            throw new Error(`Failed to get response: ${error.message}`);
          }
          throw new Error('Failed to get response from digital twin');
        }
      }
    );
    
    log('Chat tool registered successfully');
  },
  {
    // Server options (empty for now)
  },
  {
    // Handler options
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: true,
  }
);

// Wrap handler with logging
const loggingHandler = async (req: Request) => {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const transport = pathParts[pathParts.length - 1] || 'unknown';
  
  log(`${req.method} ${url.pathname} (transport: ${transport})`);
  
  try {
    const response = await handler(req);
    log(`Response: ${response.status} ${response.statusText}`);
    return response;
  } catch (error) {
    log(`Handler error:`, error);
    
    // Return proper error response
    return new Response(
      JSON.stringify({
        error: 'MCP Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

export { loggingHandler as GET, loggingHandler as POST };
