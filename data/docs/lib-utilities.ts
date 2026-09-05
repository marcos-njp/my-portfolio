export const libraryMetrics = [
  { label: "Modules", value: "12", description: "Focused lib/ utilities" },
  { label: "Language", value: "TypeScript", description: "Strictly typed" },
  { label: "Vector", value: "1536-dim", description: "Cosine similarity" },
  { label: "Cache TTL", value: "1h", description: "Redis auto-cleanup" },
];

// Real modules and their real exports (kept in sync with lib/).
export const keyUtilities = [
  { name: "ai-moods.ts", purpose: "Personality modes and error responses", exports: "getMoodConfig, getPersonaResponse" },
  { name: "session-memory.ts", purpose: "Redis session memory and chat history", exports: "saveConversationHistory, loadSessionData, loadChatHistory" },
  { name: "query-preprocessor.ts", purpose: "Normalization and follow-up (coreference) resolution", exports: "preprocessQuery, resolveFollowUpQuery" },
  { name: "query-validator.ts", purpose: "Query validation", exports: "validateQuery" },
  { name: "rag-utils.ts", purpose: "Vector search and context building", exports: "searchVectorContext, buildContextPrompt" },
  { name: "feedback-detector.ts", purpose: "Learns reply preferences from feedback", exports: "detectFeedback, applyFeedback" },
  { name: "url-resolver.ts", purpose: "Resolves the API and MCP endpoint URLs", exports: "getMcpEndpointUrl, resolveApiDomain" },
];
