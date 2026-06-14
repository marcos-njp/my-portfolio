import { FileCode } from "lucide-react";
import {
  DocSection,
  DocPageLayout,
  AlertBox,
  CodeBlock,
  MetricGrid,
  HighlightBox,
  Tabs,
  ModuleReferenceCard,
} from "@/components/docs/common";
import { libraryMetrics, keyUtilities } from "@/data/docs";

export function LibUtilitiesSection() {
  const utilityModules = [
    {
      id: "ai-moods",
      label: "AI Moods",
      content: (
        <div className="space-y-4">
          <HighlightBox type="info" title="Personality and voice">
            <p className="text-xs mb-2">Assembles the system prompt for each voice, driven by personality.json.</p>
            <div className="space-y-1 text-xs">
              <p>• Professional: clear, concise, and humble</p>
              <p>• Casual: relaxed, like texting a friend</p>
              <p>• Error handling: persona-aware error responses</p>
            </div>
          </HighlightBox>

          <CodeBlock title="Usage">
{`import { getMoodConfig, getPersonaResponse } from '@/lib/ai-moods';

const config = getMoodConfig('professional');
config.temperature; // 0.7 (0.9 for casual)

const error = getPersonaResponse('unrelated', 'genz');`}
          </CodeBlock>
        </div>
      ),
    },
    {
      id: "session-memory",
      label: "Session Memory",
      content: (
        <div className="space-y-4">
          <HighlightBox type="info" title="Two Redis stores, fail-fast">
            <p className="text-xs mb-2">Session memory for AI context and a full history for the History view.</p>
            <div className="space-y-1 text-xs">
              <p>• Session memory: last 8 messages for context</p>
              <p>• Chat history: the full conversation</p>
              <p>• 1 hour TTL, and it skips Redis fast if it is unreachable</p>
            </div>
          </HighlightBox>

          <CodeBlock title="Usage">
{`import { saveConversationHistory, loadSessionData, loadChatHistory } from '@/lib/session-memory';

await saveConversationHistory(sessionId, messages);

const { messages: context } = await loadSessionData(sessionId);
const fullHistory = await loadChatHistory(sessionId);`}
          </CodeBlock>
        </div>
      ),
    },
    {
      id: "query",
      label: "Query Handling",
      content: (
        <div className="space-y-4">
          <HighlightBox type="warning" title="Preprocess, then validate">
            <p className="text-xs mb-2">Typos are fixed first, then the query is checked against regex patterns.</p>
            <div className="space-y-1 text-xs">
              <p>• Professional-query detection</p>
              <p>• Manipulation and off-topic blocking</p>
              <p>• Returns an errorType for a persona-aware reply</p>
            </div>
          </HighlightBox>

          <CodeBlock title="Flow">
{`import { preprocessQuery } from '@/lib/query-preprocessor';
import { validateQuery, enhanceQuery } from '@/lib/query-validator';

const { corrected } = preprocessQuery(userMessage);
const result = validateQuery(corrected);
if (!result.isValid) return getPersonaResponse(result.errorType, mood);

const searchQuery = enhanceQuery(corrected);`}
          </CodeBlock>
        </div>
      ),
    },
    {
      id: "rag-utils",
      label: "RAG Utilities",
      content: (
        <div className="space-y-4">
          <HighlightBox type="success" title="Vector search and context">
            <p className="text-xs mb-2">Upstash auto-embeds the query, then results are filtered by score.</p>
            <div className="space-y-1 text-xs">
              <p>• topK 3, minScore 0.75 with a 0.65 fallback</p>
              <p>• Builds the context block for the prompt</p>
              <p>• Checks the context actually answers the question</p>
            </div>
          </HighlightBox>

          <CodeBlock title="Pipeline">
{`import { searchVectorContext, buildContextPrompt } from '@/lib/rag-utils';

const rag = await searchVectorContext(vectorIndex, query, { topK: 3 });
const context = buildContextPrompt(rag);`}
          </CodeBlock>
        </div>
      ),
    },
    {
      id: "response-tools",
      label: "Response Tools",
      content: (
        <div className="space-y-4">
          <HighlightBox type="tip" title="Length, persona, and feedback">
            <p className="text-xs mb-2">Keep replies short, on-persona, and adapt to feedback.</p>
            <div className="space-y-1 text-xs">
              <p>• Length guidance added to the prompt</p>
              <p>• Persona-consistency check on the output</p>
              <p>• Learns reply preferences from feedback</p>
            </div>
          </HighlightBox>

          <CodeBlock title="Modules">
{`import { validateMoodCompliance } from '@/lib/response-validator';
import { getResponseLengthInstruction } from '@/lib/response-manager';
import { detectFeedback } from '@/lib/feedback-detector';

const lengthRule = getResponseLengthInstruction();
const feedback = detectFeedback(userMessage);
const check = validateMoodCompliance(aiOutput, mood);`}
          </CodeBlock>
        </div>
      ),
    },
  ];

  return (
    <DocPageLayout
      title="Lib Utilities Deep Dive"
      subtitle="The utility modules in lib/ that handle query processing, retrieval, memory, and the AI voice."
    >
      <AlertBox type="info" icon={FileCode} title="Architecture overview">
        <p>
          The lib/ directory is a set of small, single-purpose modules: query preprocessing and validation, vector
          retrieval, session memory, the AI voice, and response checks. Each one does one thing so the chat route
          stays readable.
        </p>
      </AlertBox>

      <DocSection title="Library overview">
        <MetricGrid metrics={libraryMetrics} columns={4} />
      </DocSection>

      <DocSection title="Core modules">
        <Tabs items={utilityModules} defaultTab="ai-moods" />
      </DocSection>

      <DocSection title="Module reference">
        <div className="grid grid-cols-2 gap-3">
          {keyUtilities.map((util, index) => (
            <ModuleReferenceCard key={index} name={util.name} purpose={util.purpose} exports={util.exports} />
          ))}
        </div>
      </DocSection>

      <DocSection title="A request, end to end">
        <CodeBlock title="app/api/chat/route.ts (simplified)">
{`// 1. Clean up and validate the query
const { corrected } = preprocessQuery(userQuery);
const validation = validateQuery(corrected);
if (!validation.isValid) return getPersonaResponse(validation.errorType, mood);

// 2. Load conversation context (fails fast if Redis is down)
const { messages: history } = await loadSessionData(sessionId);

// 3. Retrieve relevant chunks
const rag = await searchVectorContext(vectorIndex, enhanceQuery(corrected), { topK: 3 });

// 4. Stream the answer in the chosen voice
const { systemPromptAddition, temperature } = getMoodConfig(mood);

// 5. Save back to memory
await saveConversationHistory(sessionId, [...history, userMsg, aiMsg]);`}
        </CodeBlock>
      </DocSection>
    </DocPageLayout>
  );
}
