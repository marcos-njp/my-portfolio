# MCP Server Setup for Digital Twin Chat

This project now includes a Model Context Protocol (MCP) server that allows Claude Desktop to interact with Niño Marcos's digital twin chatbot.

## 🚀 Quick Setup

### 1. Local Development

Start the development server:

```bash
pnpm dev
```

The MCP endpoint will be available at: `http://localhost:3000/api/mcp`

### 2. Configure Claude Desktop

Add this configuration to your Claude Desktop config file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "digital-twin": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "http://localhost:3000/api/mcp"
      ]
    }
  }
}
```

### 3. Restart Claude Desktop

Look for the hammer icon (🔨) in the input box to confirm MCP tools are available.

### 4. Start Chatting!

Ask Claude to use the digital twin tool:
- "Use the digital twin tool to ask about Niño's projects"
- "Chat with Niño's digital twin about his technical skills"
- "Ask the digital twin about Niño's experience with Next.js"

### 3. Production Configuration (Vercel)

For your deployed app at `https://m-njp.vercel.app`, use:

```json
{
  "mcpServers": {
    "digital-twin-production": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://m-njp.vercel.app/api/sse"
      ]
    }
  }
}
```

**Important Notes:**
- The URL must end with `/api/sse` (for Server-Sent Events transport)
- Alternatively, use `/api/messages` for HTTP polling
- The `[transport]` route dynamically handles both transport types
- First connection may take 20-30 seconds as Vercel cold-starts the function
```

## 🛠️ Available Tools

### `chat_with_digital_twin`

Chat with Niño Marcos's digital twin to learn about his professional background.

**Parameters:**
- `message` (required): Your question or message (1-1000 characters)
- `mood` (optional): Response tone - `professional`, `casual`, or `genz` (default: `professional`)
- `sessionId` (optional): Session ID for conversation continuity

**Example Usage in Claude:**
```
Use the chat_with_digital_twin tool with message "What are your most impressive projects?" and mood "professional"
```

## 📁 Project Structure

```
app/
  api/
    [transport]/
      route.ts          # MCP handler endpoint
    chat/
      route.ts          # Existing chat API (called by MCP)
  actions/
    mcp-actions.ts      # Server actions for testing

lib/
  chat-mcp.ts          # Shared chat logic & tool definitions
  url-resolver.ts      # URL resolution utilities
```

## 🔧 How It Works

1. **Claude Desktop** connects to the MCP server via the `/api/[transport]` endpoint
2. **MCP Handler** processes tool calls using `mcp-handler` library
3. **Tool calls** are forwarded to the existing `/api/chat` endpoint
4. **RAG System** (Upstash Vector + Groq AI) generates contextual responses
5. **Streaming response** is returned to Claude Desktop

## 🧪 Testing Locally

You can test the MCP server actions without Claude Desktop:

```typescript
import { chatWithDigitalTwin, listMcpTools } from '@/app/actions/mcp-actions';

// List available tools
const tools = await listMcpTools();

// Chat with digital twin
const response = await chatWithDigitalTwin({
  message: "Tell me about your experience with Next.js",
  mood: "professional"
});
```

## 📚 Learn More

- [Model Context Protocol](https://modelcontextprotocol.io/) - Official MCP documentation
- [mcp-handler](https://www.npmjs.com/package/mcp-handler) - HTTP-based MCP handler
- [mcp-remote](https://www.npmjs.com/package/mcp-remote) - Bridge for Claude Desktop
- [Claude Desktop](https://claude.ai/download) - Download Claude Desktop

## 🎯 Features

- ✅ Chat with AI digital twin via Claude Desktop
- ✅ Multiple mood settings (professional, casual, genz)
- ✅ Session continuity support
- ✅ RAG-powered responses using Upstash Vector
- ✅ Groq AI (llama-3.1-8b-instant) for fast responses
- ✅ Vercel-ready deployment

---

Built with Next.js 15, mcp-handler, Groq AI, and Upstash Vector
