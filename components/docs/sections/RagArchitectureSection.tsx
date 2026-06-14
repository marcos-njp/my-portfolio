import { 
  DocSection,
  DocPageLayout,
  AlertBox, 
  ComparisonGrid, 
  StepList, 
  CodeBlock,
  MetricGrid,
  HighlightBox,
  Tabs
} from "@/components/docs/common";
import { architectureFlow, systemMetrics, validationPatterns } from "@/data/docs";

export function RagArchitectureSection() {
  const ragComponents = [
    {
      id: "groq",
      label: "Groq AI",
      content: (
        <div className="space-y-4">
          <HighlightBox type="info" title="Model Configuration">
            <p className="text-xs mb-2">llama-3.3-70b-versatile - Optimized for speed and accuracy</p>
            <div className="space-y-1">
              <p>• Temperature: 0.7 (Professional) / 0.9 (Casual)</p>
              <p>• Length: guided by the prompt, no hard token cap</p>
              <p>• Streaming: enabled for real-time response</p>
            </div>
          </HighlightBox>
          
          <CodeBlock title="Integration">
{`import { createGroq } from '@ai-sdk/groq';
const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

const { textStream } = await streamText({
  model: groq('llama-3.3-70b-versatile'),
  messages: [systemPrompt, ...conversationHistory, userMessage],
  temperature: mood === 'professional' ? 0.7 : 0.9
});`}
          </CodeBlock>
        </div>
      )
    },
    {
      id: "vector",
      label: "Upstash Vector", 
      content: (
        <div className="space-y-4">
          <HighlightBox type="info" title="Vector Database Setup">
            <p className="text-xs mb-2">Serverless vector database with hosted embeddings</p>
            <div className="space-y-1">
              <p>• Embedding model: BGE-large (Upstash hosted)</p>
              <p>• Dimensions: 1024</p>
              <p>• Distance metric: Cosine similarity</p>
            </div>
          </HighlightBox>

          <CodeBlock title="Search Implementation">
{`const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN
});

// Upstash auto-embeds the text, no manual vector needed
const results = await vectorIndex.query({
  data: query,
  topK: 3,
  includeMetadata: true,
});
// then keep score >= 0.75, else fall back to top 2 >= 0.65`}
          </CodeBlock>
        </div>
      )
    },
    {
      id: "validation",
      label: "Semantic Validation",
      content: (
        <div className="space-y-4">
          <HighlightBox type="warning" title="Query Pattern Detection">
            <p className="text-xs mb-2">Dynamic regex patterns replace hardcoded keyword matching</p>
          </HighlightBox>
          
          <div className="space-y-3">
            {validationPatterns.map((pattern, index) => (
              <div key={index} className="rounded-lg border p-3">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm">{pattern.name}</h4>
                  <span className="text-xs bg-muted px-2 py-1 rounded">{pattern.result.split(' - ')[0]}</span>
                </div>
                <code className="text-xs bg-muted px-2 py-1 rounded block mb-1">{pattern.pattern}</code>
                <p className="text-xs text-muted-foreground">{pattern.result}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }
  ];

  return (
    <DocPageLayout
      title="Retrieval & Response Flow"
      subtitle="Technical deep dive into the retrieval, validation, and streaming pipeline powering the AI digital twin."
    >
      <DocSection title="System Overview">
        <p className="text-sm text-muted-foreground mb-4">
          The RAG system combines real-time vector search with large language model generation to provide accurate, 
          context-aware responses about professional background, skills, and experience.
        </p>
        
        <MetricGrid metrics={systemMetrics} columns={4} />
      </DocSection>

      <DocSection title="Request Flow">
        <CodeBlock title="Complete Pipeline">
          <StepList steps={architectureFlow} />
        </CodeBlock>
      </DocSection>

      <DocSection title="Core Components">
        <Tabs items={ragComponents} defaultTab="groq" />
      </DocSection>

      <DocSection title="Semantic Validation System">
        <p className="text-sm text-muted-foreground mb-4">
          Advanced query validation replaces hardcoded keyword matching with intelligent pattern detection 
          for context-sensitive error handling.
        </p>

        <ComparisonGrid
          before={{
            title: "Before: Hardcoded Keywords",
            items: [
              "Static keyword lists",
              "Binary valid/invalid responses", 
              "No context awareness",
              "Generic error messages",
              "Brittle pattern matching"
            ]
          }}
          after={{
            title: "After: Semantic Validation",
            items: [
              "Dynamic regex patterns",
              "6 distinct error types", 
              "Context-aware responses",
              "Persona-specific error handling",
              "Robust semantic analysis"
            ]
          }}
        />

        <CodeBlock title="Implementation" className="mt-4">
{`// lib/query-validator.ts
export function validateQuery(query: string): ValidationResult {
  // Pattern-based validation with error type classification
  if (MANIPULATION_PATTERNS.test(query)) return { errorType: 'manipulation' };
  if (query.length < 10) return { errorType: 'too_short' };
  if (UNRELATED_PATTERNS.test(query)) return { errorType: 'unrelated' };
  
  return { isValid: true };
}

// Usage in API
const validation = validateQuery(query);
if (validation.errorType) {
  return getPersonaResponse(validation.errorType, mood);
}`}
        </CodeBlock>
      </DocSection>

      <DocSection title="Performance & Accuracy">
        <div className="grid md:grid-cols-2 gap-4">
          <HighlightBox type="success" title="Search Accuracy">
            <p className="text-xs">75% relevance threshold with 65% fallback ensures high-quality results</p>
          </HighlightBox>
          <HighlightBox type="success" title="Streaming">
            <p className="text-xs">Responses stream token by token, so text appears as it is generated</p>
          </HighlightBox>
          <HighlightBox type="success" title="Context Quality">
            <p className="text-xs">Dual storage system optimizes both AI context and user experience</p>
          </HighlightBox>
          <HighlightBox type="success" title="Error Handling">
            <p className="text-xs">Persona-aware error responses keep the voice consistent across error states</p>
          </HighlightBox>
        </div>

        <AlertBox type="info" title="Technical Specifications" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div>
              <p className="font-medium">Vector Dimensions</p>
              <p>1024 (BGE-large)</p>
            </div>
            <div>
              <p className="font-medium">Search TopK</p>
              <p>3 results</p>
            </div>
            <div>
              <p className="font-medium">Min Score</p>
              <p>0.75 (0.65 fallback)</p>
            </div>
            <div>
              <p className="font-medium">Response TTL</p>
              <p>1 hour (Redis)</p>
            </div>
          </div>
        </AlertBox>
      </DocSection>
    </DocPageLayout>
  );
}
