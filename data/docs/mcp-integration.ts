export const mcpFlow = [
  {
    title: "Client Request",
    description: "Claude Desktop or other MCP client sends HTTP POST to https://m-njp.vercel.app/api/mcp",
  },
  {
    title: "Transport Layer",
    description: "MCP handler validates request format, extracts tool calls, and forwards to chat API",
  },
  {
    title: "Chat Processing",
    description: "Consolidated pipeline: typo correction → feedback detection → validation → RAG search → persona-aware AI generation",
  },
  {
    title: "Response Formatting",
    description: "Convert streaming AI response to MCP protocol format with proper tool result structure",
  },
  {
    title: "Client Delivery",
    description: "Structured JSON response sent back to Claude Desktop with conversation context",
  },
];

export const mcpMetrics = [
  { label: "Protocol", value: "HTTP", description: "RESTful communication" },
  { label: "Endpoint", value: "/api/mcp", description: "Single route handler" },
  { label: "Deployment", value: "Vercel Edge", description: "Global distribution" },
  { label: "Transport", value: "JSON", description: "Structured messaging" },
];
