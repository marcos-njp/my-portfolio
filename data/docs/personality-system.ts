export const personalityWorkflowSteps = [
  {
    title: "personality.json Loaded",
    description: "Build time: lib/ai-moods.ts imports traits, guidelines, red flags",
  },
  {
    title: "Mood Config Generated",
    description: "Professional or GenZ system prompts created with specific tone rules",
  },
  {
    title: "User Sends Query",
    description: "Query processed through validation, preprocessing, FAQ matching",
  },
  {
    title: "Session Memory Loaded",
    description: "Redis: Last 8 messages for AI context + full history for UI display",
  },
  {
    title: "RAG Search Executed",
    description: "Upstash Vector: Semantic search with personality-aware results",
  },
  {
    title: "Context Assembly",
    description: "Memory + RAG + personality rules + mood-specific prompts combined",
  },
  {
    title: "AI Response Generated",
    description: "Groq AI: openai/gpt-oss-120b with personality validation and error handling",
  },
  {
    title: "Memory Updated",
    description: "New exchange saved to Redis for future follow-up context",
  },
];

export const storageMetrics = [
  { label: "Session Memory", value: "8 messages", description: "AI context optimization" },
  { label: "Storage TTL", value: "1h", description: "Auto-cleanup" },
  { label: "Redis Keys", value: "2 types", description: "Memory + history separation" },
];

export const personalityErrorTypes = [
  {
    title: "Unrelated Queries",
    professional: "I focus on my professional background and technical projects. Please ask about my experience, skills, or projects.",
    genz: "yo that's not really about me or my work, ask me something about my projects or tech stuff instead!",
  },
  {
    title: "Too Short/Unclear",
    professional: "Could you provide more context so I can give you a comprehensive response?",
    genz: "ngl that's a bit vague, can you be more specific about what you wanna know?",
  },
  {
    title: "No Context Available",
    professional: "I don't have specific information about that topic in my knowledge base.",
    genz: "hmm I don't have the deets on that one, try asking about something else!",
  },
];
