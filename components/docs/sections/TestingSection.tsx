import { TestTube } from "lucide-react";
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
import { improvementMetrics, loadingStates, feedbackImplementations } from "@/data/docs";

export function TestingSection() {

  const testingEvolution = [
    {
      id: "streaming",
      label: "Streaming UX",
      content: (
        <div className="space-y-4">
          <HighlightBox type="info" title="Progressive Loading States">
            <p className="text-xs mb-3">Multi-stage indicators show AI processing status as response generation progresses</p>
            <div className="grid sm:grid-cols-3 gap-3">
              {loadingStates.map((state, index) => (
                <div key={index} className="rounded-md bg-muted p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <p className="font-medium text-xs">{state.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{state.description}</p>
                </div>
              ))}
            </div>
          </HighlightBox>

          <CodeBlock title="Timeout Protection">
{`const abortController = new AbortController();
setTimeout(() => abortController.abort(), 12000);

const result = await streamText({
  model: groq('llama-3.3-70b-versatile'),
  signal: abortController.signal
});`}
          </CodeBlock>
        </div>
      )
    },
    {
      id: "followup",
      label: "Follow-up Intelligence", 
      content: (
        <div className="space-y-4">
          <ComparisonGrid
            before={{
              title: "Before Enhancement",
              items: [
                "\"What do you mean by 'it'?\"",
                "Context lost between messages", 
                "No pronoun resolution",
                "Repeated clarifications needed"
              ]
            }}
            after={{
              title: "After Enhancement", 
              items: [
                "\"The AI Portfolio uses Next.js 16...\"",
                "Full conversation context maintained",
                "Smart pronoun resolution", 
                "Natural follow-up conversations"
              ]
            }}
          />

          <CodeBlock title="Implementation">
{`// lib/session-memory.ts - CRITICAL FOLLOW-UP RULES
User: "Tell me about your AI projects"
AI: "I built an AI-Powered Portfolio with RAG..."
User: "What tech stack did it use?" 
System: ✓ Checks history for "it" → References AI Portfolio`}
          </CodeBlock>
        </div>
      )
    },
    {
      id: "integration",
      label: "System Integration",
      content: (
        <div className="space-y-4">
          <HighlightBox type="success" title="Major Consolidation (Latest)">
            <p className="text-xs">Unified validation pipeline combining query preprocessing, typo correction, semantic validation, and adaptive feedback detection into a maintainable architecture</p>
          </HighlightBox>

          <ComparisonGrid
            before={{
              title: "Before Integration", 
              items: [
                "Scattered validation logic across files",
                "Hardcoded typo correction dictionary",
                "Redundant knowledge gap detectors", 
                "Feedback detection issues after validation"
              ]
            }}
            after={{
              title: "After Integration",
              items: [
                "Consolidated lib/query-validator.ts",
                "Pattern-based typo correction system",
                "Unified semantic validation with confidence scoring",
                "Properly ordered feedback detection pipeline"
              ]
            }}
          />

          <CodeBlock title="New Architecture">
{`// Consolidated validation pipeline in chat API:
1. Preprocess query (typo fixes)
2. Detect feedback BEFORE validation 
3. Validate query (off-topic, professional, knowledge gaps)
4. Enhanced query for better results
5. RAG search with context relevance checking
6. Generate persona-aware response`}
          </CodeBlock>
        </div>
      )
    },
    {
      id: "optimization",
      label: "Performance Tuning",
      content: (
        <div className="space-y-4">
          <MetricGrid metrics={improvementMetrics} columns={2} />

          <HighlightBox type="success" title="Token Optimization Results">
            <p className="text-xs">System prompts were trimmed a lot while keeping the personality intact, which cut token use and latency.</p>
          </HighlightBox>

          <div className="grid md:grid-cols-2 gap-4">
            <HighlightBox type="info" title="Memory Efficiency">
              <p className="text-xs">Dual storage: 8 messages for AI context, complete history for UI display</p>
            </HighlightBox>
            <HighlightBox type="info" title="Query Processing">
              <p className="text-xs">Semantic validation patterns replace hardcoded keyword matching</p>
            </HighlightBox>
          </div>
        </div>
      )
    }
  ];

  return (
    <DocPageLayout
      title="Testing & Evolution"
      subtitle="Recent major system integration consolidating validation pipelines, adaptive feedback detection, and performance optimization through iterative testing and refactoring."
    >
      <AlertBox type="info" icon={TestTube} title="Testing Philosophy">
        <p>
          Every feature undergoes user testing to ensure the AI digital twin provides authentic, helpful responses. 
          Improvements are based on real conversation patterns and user feedback to create a natural, engaging experience.
        </p>
      </AlertBox>

      <DocSection title="Major Improvements">
        <Tabs items={testingEvolution} defaultTab="streaming" />
      </DocSection>

      <DocSection title="Feedback Implementation">
        <p className="text-sm text-muted-foreground mb-4">
          User feedback drives continuous system enhancements across UX, performance, and conversation quality.
        </p>

        <CodeBlock title="Implementation Workflow">
          <StepList steps={feedbackImplementations} />
        </CodeBlock>

        <HighlightBox type="tip" title="Real-world Testing" className="mt-4">
          <p className="text-xs">
            Features tested with actual portfolio visitors including recruiters, developers, and students. 
            Personality modes validated for appropriate tone and response quality in different contexts.
          </p>
        </HighlightBox>
      </DocSection>

      <DocSection title="Performance Evolution">
        <div className="grid md:grid-cols-2 gap-4">
          <HighlightBox type="success" title="Response Quality">
            <div className="space-y-2">
              <p className="text-xs">Specific, contextual answers</p>
              <p className="text-xs">Consistent personality modes</p>
              <p className="text-xs">Natural follow-up conversations</p>
            </div>
          </HighlightBox>

          <HighlightBox type="success" title="System Reliability">
            <div className="space-y-2">
              <p className="text-xs">Graceful error handling</p>
              <p className="text-xs">Timeout protection</p>
              <p className="text-xs">Memory optimization</p>
            </div>
          </HighlightBox>
        </div>

        <CodeBlock title="Key Metrics" className="mt-4">
{`System notes:
• Streaming responses so replies feel fast
• Leaner prompts to cut token use
• Follow-ups resolve pronouns from conversation history
• Validation consolidated into a few core modules
• Session memory keeps context across a conversation
• Context checks reduce hallucinated answers
• Persona-aware error handling for off-topic or rate-limited cases`}
        </CodeBlock>
      </DocSection>
    </DocPageLayout>
  );
}
