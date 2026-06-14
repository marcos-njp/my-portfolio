export const architectureFlow = [
  {
    title: "Query preprocessing",
    description: "Typo correction and normalization so the search sees a clean query",
  },
  {
    title: "Query validation",
    description: "Regex patterns flag off-topic or manipulative queries and return a persona-aware error",
  },
  {
    title: "Vector search",
    description: "Semantic search in Upstash Vector (topK 3, minScore 0.75, with a 0.65 fallback tier)",
  },
  {
    title: "Context assembly",
    description: "Session memory, retrieved chunks, and personality rules are combined into the prompt",
  },
  {
    title: "AI generation",
    description: "Groq streams the response token by token in the selected voice",
  },
  {
    title: "Response checks",
    description: "Light persona-consistency checks run as the answer is delivered",
  },
];

export const systemMetrics = [
  { label: "AI Model", value: "Groq", description: "llama-3.3-70b-versatile" },
  { label: "Vector DB", value: "Upstash", description: "Serverless, cosine" },
  { label: "Embedding", value: "1024-dim", description: "BGE-large, auto-embedded" },
  { label: "Relevance", value: "0.75", description: "Min score, 0.65 fallback" },
];

export const validationPatterns = [
  {
    name: "Professional queries",
    pattern: "/(experience|project|skill|tech|background)/i",
    result: "Valid - proceeds to RAG search",
  },
  {
    name: "Too short or unclear",
    pattern: "/^.{1,10}$/",
    result: "too_short - persona-aware error response",
  },
  {
    name: "Unrelated content",
    pattern: "/(weather|recipe|movie|game)/i",
    result: "unrelated - polite redirection",
  },
  {
    name: "Manipulation attempts",
    pattern: "/(ignore|forget|pretend|roleplay)/i",
    result: "manipulation - firm boundary response",
  },
];
