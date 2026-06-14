export const improvementMetrics = [
  { label: "Model", value: "Groq", description: "llama-3.3-70b-versatile" },
  { label: "Responses", value: "Streamed", description: "Token by token" },
  { label: "Client timeout", value: "30s", description: "Then a graceful error" },
  { label: "Min score", value: "0.75", description: "0.65 fallback" },
];

export const loadingStates = [
  { title: "Thinking", description: "Reading your question" },
  { title: "Searching", description: "Finding the relevant context" },
  { title: "Writing", description: "Composing the answer" },
];

export const feedbackImplementations = [
  {
    title: "Adaptive feedback detection",
    description: "Learns preferences like \"be more detailed\" or \"shorter responses\" and applies them for the session",
  },
  {
    title: "Pattern-based typo correction",
    description: "Fixes common typos with regex patterns instead of a hardcoded dictionary",
  },
  {
    title: "Consolidated validation",
    description: "A single query-validation path instead of scattered checks across files",
  },
  {
    title: "Context relevance checking",
    description: "Confirms the retrieved chunks actually answer the question before replying",
  },
  {
    title: "Ordered pipeline",
    description: "Feedback is detected before validation so it does not get misread as a query",
  },
  {
    title: "Knowledge gap detection",
    description: "Spots when the answer is not in the knowledge base and falls back honestly",
  },
];
