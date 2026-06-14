export const libraryMetrics = [
  { label: "Modules", value: "12", description: "Focused lib/ utilities" },
  { label: "Language", value: "TypeScript", description: "Strictly typed" },
  { label: "Vector", value: "1024-dim", description: "Cosine similarity" },
  { label: "Cache TTL", value: "1h", description: "Redis auto-cleanup" },
];

// Real modules and their real exports (kept in sync with lib/).
export const keyUtilities = [
  { name: "ai-moods.ts", purpose: "Personality modes and error responses", exports: "getMoodConfig, getPersonaResponse" },
  { name: "session-memory.ts", purpose: "Redis session memory and chat history", exports: "saveConversationHistory, loadSessionData, loadChatHistory" },
  { name: "query-preprocessor.ts", purpose: "Typo fixes and query normalization", exports: "preprocessQuery, fixTypos" },
  { name: "query-validator.ts", purpose: "Query validation and enhancement", exports: "validateQuery, enhanceQuery" },
  { name: "rag-utils.ts", purpose: "Vector search and context building", exports: "searchVectorContext, buildContextPrompt" },
  { name: "response-validator.ts", purpose: "Checks a reply stays on-persona", exports: "validateMoodCompliance" },
  { name: "response-manager.ts", purpose: "Response length guidance", exports: "getResponseLengthInstruction" },
  { name: "feedback-detector.ts", purpose: "Learns reply preferences from feedback", exports: "detectFeedback, applyFeedback" },
  { name: "interviewer-faqs.ts", purpose: "Maps common questions to context hints", exports: "findRelevantFAQPatterns, buildContextHints" },
  { name: "url-resolver.ts", purpose: "Resolves the API and MCP endpoint URLs", exports: "getMcpEndpointUrl, resolveApiDomain" },
];
