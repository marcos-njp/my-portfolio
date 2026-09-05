"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { DigitalNino } from "@/components/digital-nino";
import {
  AlertBox,
  CodeBlock,
  DocPageLayout,
  DocSection,
  HighlightBox,
  StepList,
} from "@/components/docs/common";

const companionSyncSteps = [
  {
    title: "Idle state",
    description:
      "The chat trigger rotates through short idle lines, while the modal companion shows its normal dot-matrix animation.",
  },
  {
    title: "Submit starts the sync",
    description:
      "When a message is sent, the UI appends an empty assistant bubble and flips isLoading to true in the chat modal.",
  },
  {
    title: "Thinking state is shared",
    description:
      "That same isLoading flag drives both the robot mouth animation and the small status line, so the companion and the text state always move together.",
  },
  {
    title: "Streaming keeps the reply live",
    description:
      "As chunks arrive from the API stream, the assistant bubble is updated in place instead of waiting for a full response.",
  },
  {
    title: "Finish resets the companion",
    description:
      "When streaming ends, isLoading becomes false, the robot calms down, and the companion dialogue switches to a short post-reply acknowledgement.",
  },
];

const promptFlowSteps = [
  {
    title: "Normalize and correct the prompt",
    description:
      "The input is trimmed, spacing is normalized, common typos are fixed, and key technical terms are fuzzy-corrected before retrieval starts.",
  },
  {
    title: "Run the first-layer filters",
    description:
      "The server checks for unprofessional requests, feedback instructions, and short follow-ups before normal validation rules kick in.",
  },
  {
    title: "Classify intent and reject bad prompts",
    description:
      "Regex-driven validation detects manipulation attempts, unrelated questions, personal requests, entertainment prompts, and knowledge gaps.",
  },
  {
    title: "Enhance and route the query",
    description:
      "Follow-ups are resolved against conversation history first, then the search query is sent to Upstash Vector.",
  },
  {
    title: "Validate the retrieved context",
    description:
      "Top results are filtered by score and checked for relevance so weak matches do not slip into the final answer.",
  },
  {
    title: "Assemble the full system prompt",
    description:
      "The final prompt combines personality mode, conversation history, vector context, and feedback preferences.",
  },
  {
    title: "Stream and persist the answer",
    description:
      "Groq streams the response, mood compliance is checked on finish, and both session memory and full chat history are saved back to Redis.",
  },
];

export function CompanionProcessingSection() {
  const { resolvedTheme } = useTheme();
  const theme: "dark" | "light" = resolvedTheme === "light" ? "light" : "dark";
  const [thinking, setThinking] = useState(false);

  return (
    <DocPageLayout
      title="Companion & Prompt Flow"
      subtitle="How the robot companion stays synchronized with loading state, streaming, and the validation-first prompt pipeline."
    >
      <AlertBox type="info" title="Why this page exists">
        <p>
          This part documents the front-end companion behavior and the back-end prompt processing together, because they
          are tied to the same chat lifecycle. The robot does not guess when to talk. It follows the same state that
          controls request submission, streaming, and completion.
        </p>
      </AlertBox>

      <DocSection title="Robot Companion States">
        <div className="rounded-md border border-border bg-card p-6 flex flex-col sm:flex-row items-center gap-6 mb-4">
          <DigitalNino size={96} mood="normal" isTalking={thinking} theme={theme} />
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm text-muted-foreground mb-3">
              This is the live companion. Toggle the thinking state to see the exact animation the chat uses, and tap the robot to make it spin.
            </p>
            <button type="button" onClick={() => setThinking((v) => !v)} className="nm-link nm-hover">
              {thinking ? "Stop thinking" : "Make it think"}
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <HighlightBox type="info" title="Idle">
            <p className="text-xs">Rotating helper lines invite a conversation before the modal opens.</p>
          </HighlightBox>
          <HighlightBox type="info" title="Thinking">
            <p className="text-xs">The companion switches to the loading animation the moment the request is in flight.</p>
          </HighlightBox>
          <HighlightBox type="info" title="After reply">
            <p className="text-xs">Short acknowledgement lines appear after the stream finishes, then the companion returns to idle.</p>
          </HighlightBox>
        </div>
      </DocSection>

      <DocSection title="How Thinking Synchronization Works">
        <StepList steps={companionSyncSteps} />

        <CodeBlock title="Shared UI state">
{`// components/sections/ai-chat-section.tsx
setIsLoading(true);

<DigitalNino size={26} mood="normal" isTalking={isLoading} theme={robotTheme} />
<span>{isLoading ? "Thinking..." : companionDialogue}</span>

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  streamedContent += decoder.decode(value, { stream: true });
}

setIsLoading(false);`}
        </CodeBlock>
      </DocSection>

      <DocSection title="Prompt Processing, Filters, and Detection">
        <StepList steps={promptFlowSteps} />
      </DocSection>

      <DocSection title="What Gets Packed Into the Final Prompt">
        <CodeBlock title="Server-side assembly">
{`// app/api/chat/route.ts
const preprocessed = preprocessQuery(userQuery);
const cleanQuery = preprocessed.corrected;

const detectedFeedback = detectFeedback(cleanQuery);
const shouldSkipValidation = isFeedbackQuery || isShortFollowUp || isFollowUpResponse;
if (!shouldSkipValidation) {
  const validation = validateQuery(cleanQuery);
  if (!validation.isValid) return personaAwareError;
}

const ragContext = await searchVectorContext(vectorIndex, searchQuery, {
  topK: RAG_THRESHOLDS.topK,
  minScore: RAG_THRESHOLDS.routeMinScore,
});

const finalSystemPrompt = [
  moodConfig.systemPromptAddition,
  SYSTEM_PROMPT,
  conversationContext,
  contextInfo,
  faqContextHints,
  feedbackInstruction,
  lengthInstruction,
].filter(Boolean).join("\\n");`}
        </CodeBlock>
      </DocSection>
    </DocPageLayout>
  );
}
