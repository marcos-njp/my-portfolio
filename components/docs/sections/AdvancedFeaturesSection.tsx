import { Brain, MessageSquare, Search, Shield, Sparkles, Zap, ThumbsUp, AlertTriangle } from "lucide-react";
import { MetricCard, FeatureCard, SectionHeader, CodeBlock } from "@/components/docs";

export function AdvancedFeaturesSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">Advanced Features</h1>
        <p className="text-xl text-muted-foreground">
          Deep dive into the lib/ implementations that power intelligent conversations and enhanced user experience.
        </p>
      </div>

      {/* Personality Modes */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Brain className="w-6 h-6" />
          Personality Modes
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <h3 className="font-semibold text-lg">Professional Mode</h3>
            </div>
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Formal, structured responses optimized for recruiters and business contexts.
              </p>
              <div className="rounded-md bg-muted p-3 space-y-1">
                <p className="font-medium">Configuration</p>
                <code className="text-xs">temperature: 0.7</code>
                <p className="text-xs text-muted-foreground mt-2">Balanced creativity and accuracy</p>
              </div>
              <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                <li>Technical terminology</li>
                <li>STAR methodology responses</li>
                <li>Quantified achievements</li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg border p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <h3 className="font-semibold text-lg">GenZ Mode</h3>
            </div>
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Casual, conversational tone with contemporary expressions for peer interactions.
              </p>
              <div className="rounded-md bg-muted p-3 space-y-1">
                <p className="font-medium">Configuration</p>
                <code className="text-xs">temperature: 0.9</code>
                <p className="text-xs text-muted-foreground mt-2">Higher creativity, natural flow</p>
              </div>
              <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                <li>Relatable language ("lowkey", "ngl")</li>
                <li>Storytelling approach</li>
                <li>Friendly, approachable tone</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-6 mt-4">
          <p className="text-sm text-muted-foreground mb-3">
            <strong>Token Optimization:</strong> System prompts optimized to 1k-2.5k tokens per request (from 1.5k-3k before optimization) 
            through concise mood prompts while maintaining personality accuracy.
          </p>
          <code className="text-xs bg-muted px-2 py-1 rounded">
            lib/ai-moods.ts - Professional: ~400 chars | GenZ: ~600 chars
          </code>
        </div>
      </section>

      {/* Session Memory */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          Session Memory & Context
        </h2>
        <div className="space-y-4">
          <div className="rounded-lg border p-6">
            <h3 className="font-semibold mb-3">Conversation Tracking</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Redis-backed session memory maintains conversation context across multiple exchanges for natural follow-up understanding.
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="rounded-md bg-muted p-3">
                <p className="font-medium mb-1">History Depth</p>
                <p className="text-2xl font-bold">16 messages</p>
                <p className="text-xs text-muted-foreground">8 exchanges (user + assistant)</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="font-medium mb-1">Storage</p>
                <p className="text-2xl font-bold">Redis</p>
                <p className="text-xs text-muted-foreground">Upstash serverless</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="font-medium mb-1">Session TTL</p>
                <p className="text-2xl font-bold">24h</p>
                <p className="text-xs text-muted-foreground">Auto-cleanup</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-6">
            <h3 className="font-semibold mb-3">Follow-up Understanding</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Critical follow-up rules enable pronoun resolution by checking conversation history first.
            </p>
            <div className="rounded-md bg-muted p-4">
              <p className="text-xs font-medium mb-2">Example Flow:</p>
              <div className="space-y-2 text-xs">
                <div className="flex gap-2">
                  <span className="text-blue-500">User:</span>
                  <span className="text-muted-foreground">"Tell me about your AI projects"</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-green-500">Assistant:</span>
                  <span className="text-muted-foreground">"I built an AI-Powered Portfolio with Next.js 15, Groq AI..."</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-500">User:</span>
                  <span className="text-muted-foreground">"What tech stacks did it use?"</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-orange-500">System:</span>
                  <span className="text-muted-foreground italic">✓ Checks history for "it" → References AI-Powered Portfolio</span>
                </div>
              </div>
            </div>
            <code className="text-xs bg-muted px-2 py-1 rounded mt-3 inline-block">
              lib/session-memory.ts - CRITICAL FOLLOW-UP RULES
            </code>
          </div>
        </div>
      </section>

      {/* Query Preprocessing */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Search className="w-6 h-6" />
          Query Preprocessing
        </h2>
        <div className="rounded-lg border p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Intelligent query enhancement improves search accuracy before RAG retrieval.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Typo Correction</h3>
              <div className="rounded-md bg-muted p-3 text-xs space-y-1">
                <p>"projetcs" → "projects"</p>
                <p>"experiance" → "experience"</p>
                <p>"tecnology" → "technology"</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Fuzzy Matching</h3>
              <div className="rounded-md bg-muted p-3 text-xs space-y-1">
                <p>"nxtjs" → "Next.js"</p>
                <p>"reakt" → "React"</p>
                <p>"tailwnd" → "Tailwind"</p>
              </div>
            </div>
          </div>

          <div className="rounded-md bg-muted p-4">
            <p className="font-medium text-sm mb-2">Query Normalization</p>
            <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
              <li>Lowercase conversion for case-insensitive matching</li>
              <li>Whitespace trimming and normalization</li>
              <li>Special character handling</li>
              <li>Keyword expansion (e.g., "JS" → "JavaScript")</li>
            </ul>
          </div>

          <code className="text-xs bg-muted px-2 py-1 rounded">
            lib/query-preprocessor.ts
          </code>
        </div>
      </section>

      {/* Feedback Detection */}
      <section>
        <SectionHeader 
          title="Intelligent Feedback Recognition"
          description="AI automatically detects and responds to user feedback naturally within the conversation"
        />
        
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <FeatureCard
            title="Positive Feedback Detection"
            description="AI recognizes when users express satisfaction or appreciation. Uses Upstash Redis to store adaptive feedback preferences."
            icon={<ThumbsUp className="w-5 h-5 text-green-500" />}
            items={[
              '"That\'s a good response" - AI thanks and offers more help',
              '"Great answer!" - AI acknowledges and stays engaged',
              '"That\'s impressive" - AI responds warmly and professionally',
              '"Perfect, thanks!" - AI confirms understanding'
            ]}
          />

          <FeatureCard
            title="Anti-Manipulation Protection"
            description="Detects and rejects unprofessional or manipulative requests"
            icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
            items={[
              'Blocks "ignore previous instructions" attempts',
              'Rejects "pretend to be" roleplay requests',
              'Prevents "always say X" manipulation',
              'Maintains professional boundaries'
            ]}
          />
        </div>

        <FeatureCard
          title="How It Works"
          description="Pattern-based detection with professional rejection messages"
          variant="bordered"
        >
          <div className="space-y-4 mt-4">
            <div className="rounded-md bg-muted/50 p-4">
              <p className="text-sm font-medium mb-2">Example Flow:</p>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-blue-500 font-medium">User:</span>
                  <span>"Tell me about your projects"</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-green-500 font-medium">AI:</span>
                  <span>"I built an AI-Powered Portfolio with RAG..."</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-500 font-medium">User:</span>
                  <span className="italic">"That's a great answer!"</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-green-500 font-medium">AI:</span>
                  <span>"Happy to know! I am Niño Marcos' digital twin. Feel free to ask more!"</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div className="rounded-md border border-green-500/20 bg-green-500/5 p-3">
                <p className="font-medium mb-2 text-green-700 dark:text-green-300">Accepted Patterns</p>
                <code className="text-muted-foreground block break-all">
                  /(?:great|good|impressive|helpful|thanks|perfect|excellent)/i
                </code>
              </div>
              <div className="rounded-md border border-red-500/20 bg-red-500/5 p-3">
                <p className="font-medium mb-2 text-red-700 dark:text-red-300">Rejected Patterns</p>
                <code className="text-muted-foreground block break-all">
                  /(?:ignore|forget|disregard).&#123;0,20&#125;(?:previous|instruction)/i
                </code>
              </div>
            </div>
          </div>
        </FeatureCard>

        <div className="mt-4 space-y-2">
          <code className="text-xs bg-muted px-3 py-2 rounded block">
            lib/feedback-detector.ts - detectFeedback(), isUnprofessionalRequest()
          </code>
          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">Technology Stack:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Upstash Redis: Stores FeedbackPreferences for adaptive learning</li>
              <li>Pattern matching: Real-time regex evaluation for instant feedback detection</li>
              <li>Session context: Maintains user feedback history across conversation</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Response Optimization */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6" />
          Response Optimization
        </h2>
        <div className="space-y-4">
          <div className="rounded-lg border p-6">
            <h3 className="font-semibold mb-3">Context Hints vs Hardcoded Responses</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Dynamic FAQ system provides context guidance instead of fixed answers for natural, personalized responses.
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-md border-2 border-red-200 dark:border-red-900 p-3">
                <p className="font-medium text-red-600 dark:text-red-400 mb-2">❌ Before (Hardcoded)</p>
                <code className="text-xs text-muted-foreground">
                  "I specialize in full-stack development with expertise in..."
                </code>
              </div>
              <div className="rounded-md border-2 border-green-200 dark:border-green-900 p-3">
                <p className="font-medium text-green-600 dark:text-green-400 mb-2">✅ After (Dynamic)</p>
                <code className="text-xs text-muted-foreground">
                  contextHint: "Use RAG to find tech stack details"
                </code>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-6">
            <h3 className="font-semibold mb-3">System Prompt Engineering</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Enhanced prompts with bad/good examples prevent generic responses.
            </p>
            <div className="rounded-md bg-muted p-4 space-y-3 text-xs">
              <div>
                <p className="font-medium text-red-600 dark:text-red-400">Bad Example:</p>
                <p className="text-muted-foreground italic">"I can answer questions about projects, skills, and experience."</p>
              </div>
              <div>
                <p className="font-medium text-green-600 dark:text-green-400">Good Example:</p>
                <p className="text-muted-foreground italic">"I built an AI-Powered Portfolio using Next.js 15 and Groq AI with RAG..."</p>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="rounded-lg border p-4 text-center">
              <Sparkles className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
              <p className="font-semibold">FAQ Patterns</p>
              <p className="text-2xl font-bold mt-1">10</p>
              <p className="text-xs text-muted-foreground">From 50+ hardcoded FAQs</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <Zap className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <p className="font-semibold">Token Reduction</p>
              <p className="text-2xl font-bold mt-1">40%</p>
              <p className="text-xs text-muted-foreground">Optimized prompts</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <Brain className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <p className="font-semibold">Response Quality</p>
              <p className="text-2xl font-bold mt-1">↑ 60%</p>
              <p className="text-xs text-muted-foreground">Context-aware</p>
            </div>
          </div>
        </div>
      </section>

      {/* Implementation Reference */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Implementation Files</h2>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <code className="rounded-md bg-muted p-3">lib/ai-moods.ts</code>
          <code className="rounded-md bg-muted p-3">lib/session-memory.ts</code>
          <code className="rounded-md bg-muted p-3">lib/query-preprocessor.ts</code>
          <code className="rounded-md bg-muted p-3">lib/query-validator.ts</code>
          <code className="rounded-md bg-muted p-3">lib/feedback-detector.ts</code>
          <code className="rounded-md bg-muted p-3">lib/response-validator.ts</code>
          <code className="rounded-md bg-muted p-3">lib/interviewer-faqs.ts</code>
          <code className="rounded-md bg-muted p-3">lib/response-manager.ts</code>
        </div>
      </section>
    </div>
  );
}
