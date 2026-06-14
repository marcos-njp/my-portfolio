import { Brain } from "lucide-react";
import { 
  DocSection,
  DocPageLayout,
  AlertBox, 
  ComparisonGrid, 
  StepList, 
  CodeBlock,
  MetricGrid,
  HighlightBox,
  ErrorTypeCard
} from "@/components/docs/common";
import { personalityWorkflowSteps, storageMetrics, personalityErrorTypes } from "@/data/docs";

export function PersonalitySystemSection() {

  return (
    <DocPageLayout
      title="Personality System Architecture"
      subtitle="How personality.json powers dual storage memory, persona-aware error handling, and prevents generic AI responses between professional and GenZ modes."
    >
      <AlertBox type="info" icon={Brain} title="The Problem We Solved">
        <p>
          Generic AI chatbots give vague, cookie-cutter responses and fail at follow-up questions. They say things like &ldquo;I can answer questions about my experience&rdquo; 
          instead of providing specific, authentic information. They also leak personality traits between modes and give the same error messages regardless of context. 
          Our system solves this with dual storage memory, persona-aware error handling, and strict personality validation.
        </p>
      </AlertBox>

      <DocSection title="The Personality Layer" subtitle="Behavior Rules That Make AI Responses Authentic">
        <p className="text-sm mb-4">
          personality.json acts as a behavioral constitution for the AI. It defines not just WHAT to say, but HOW to say it, 
          what to avoid, and how to maintain authenticity across different conversation modes.
        </p>

        <ComparisonGrid
          before={{
            title: "Without Personality System",
            items: [
              "\"I can answer questions about my projects\"",
              "\"I have experience with various technologies\"", 
              "\"Feel free to ask me anything\"",
              "Professional mode uses emojis 😊",
              "GenZ mode sounds corporate and stiff"
            ]
          }}
          after={{
            title: "With Personality System", 
            items: [
              "\"I built an AI-Powered Portfolio with RAG using Next.js 16 and Groq AI\"",
              "\"I competed internationally in robotics at 13 - finished 4th/118 teams\"",
              "\"yeah Next.js 16 with TypeScript is the main setup\" (GenZ only)",
              "Professional mode: Clear, formal, no slang",
              "GenZ mode: Casual, slang-rich, emoji-enhanced"
            ]
          }}
        />
      </DocSection>

      <DocSection title="How Personality System Works">
        <CodeBlock title="Workflow: From JSON to Response">
          <StepList steps={personalityWorkflowSteps} />
        </CodeBlock>
      </DocSection>

      <DocSection title="Dual Storage System">
        <p className="text-sm text-muted-foreground mb-4">
          Redis-backed dual storage separates AI context (8 messages) from UI display (complete history) for optimal performance and user experience.
        </p>
        
        <MetricGrid metrics={storageMetrics} />
        
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <HighlightBox type="info" title="Session Memory (AI Context)">
            <p>Key: chat_session:{`{sessionId}`}</p>
            <p>Purpose: Last 8 messages for AI conversation context</p>
            <p>Optimized for: Token efficiency, follow-up understanding</p>
          </HighlightBox>
          <HighlightBox type="tip" title="Chat History (UI Display)"> 
            <p>Key: chat_history:{`{sessionId}`}</p>
            <p>Purpose: Complete conversation for UI sidebar</p>
            <p>Optimized for: User experience, conversation review</p>
          </HighlightBox>
        </div>
      </DocSection>

      <DocSection title="Persona-Aware Error Handling">
        <p className="text-sm text-muted-foreground mb-4">
          Persona-aware error types with mood-specific responses keep the personality consistent even during error states.
        </p>
        
        <div className="space-y-4">
          {personalityErrorTypes.map((error, index) => (
            <ErrorTypeCard
              key={index}
              title={error.title}
              professional={error.professional}
              genz={error.genz}
            />
          ))}
        </div>

        <CodeBlock title="Implementation" className="mt-4">
{`// lib/response-validator.ts
export function getPersonaResponse(errorType: string, mood: 'professional' | 'genz') {
  const responses = errorResponses[errorType];
  return responses?.[mood] || responses?.professional || defaultResponse;
}

// Usage in API
const errorType = validateQuery(query);
if (errorType) {
  return getPersonaResponse(errorType, mood);
}`}
        </CodeBlock>
      </DocSection>
    </DocPageLayout>
  );
}
