import { Database, Target, Zap, TrendingUp, Award, CheckCircle } from "lucide-react";
import { StarCard } from "@/components/docs";

export function ProfileDataSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">Profile Data & STAR Methodology</h1>
        <p className="text-xl text-muted-foreground">
          Professional achievements structured using the STAR methodology (Situation, Task, Action, Result) 
          from digitaltwin.json knowledge base.
        </p>
      </div>

      {/* STAR Methodology Overview */}
      <section>
        <div className="rounded-lg border p-6">
          <h2 className="text-2xl font-semibold mb-4">What is STAR Methodology?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            STAR is a structured approach to presenting achievements and experiences in a clear, impactful way. 
            Each accomplishment is broken down into four components:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-md border-2 border-blue-400 dark:border-blue-600 bg-blue-50/30 dark:bg-blue-950/30 p-4">
              <p className="font-semibold text-blue-700 dark:text-blue-300 mb-1">Situation</p>
              <p className="text-xs text-muted-foreground">Context and background of the challenge</p>
            </div>
            <div className="rounded-md border-2 border-purple-400 dark:border-purple-600 bg-purple-50/30 dark:bg-purple-950/30 p-4">
              <p className="font-semibold text-purple-700 dark:text-purple-300 mb-1">Task</p>
              <p className="text-xs text-muted-foreground">Specific goal or objective to achieve</p>
            </div>
            <div className="rounded-md border-2 border-emerald-400 dark:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/30 p-4">
              <p className="font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Action</p>
              <p className="text-xs text-muted-foreground">Steps taken to address the task</p>
            </div>
            <div className="rounded-md border-2 border-amber-400 dark:border-amber-600 bg-amber-50/30 dark:bg-amber-950/30 p-4">
              <p className="font-semibold text-amber-700 dark:text-amber-300 mb-1">Result</p>
              <p className="text-xs text-muted-foreground">Measurable outcomes and impact</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI-Powered Portfolio Example */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6" />
          AI-Powered Portfolio Development
        </h2>
        <div className="rounded-lg border p-6 space-y-4">
          <StarCard letter="S" title="Situation">
            <p>
              Traditional portfolios lack interactivity and fail to showcase technical expertise dynamically. 
              Recruiters spend limited time per application, needing quick access to relevant information.
            </p>
          </StarCard>

          <StarCard letter="T" title="Task">
            <p>
              Create an AI-powered digital twin that can answer questions about professional background, 
              technical skills, and project experience in natural conversation, with MCP integration 
              for AI agent accessibility.
            </p>
          </StarCard>

          <StarCard letter="A" title="Action">
            <ul className="space-y-1 list-disc list-inside">
              <li>Implemented RAG system with Upstash Vector (38 knowledge chunks, 0.75 threshold with 0.65 fallback)</li>
              <li>Integrated Groq AI (llama-3.1-8b-instant) with streaming responses</li>
              <li>Built MCP server for Claude Desktop integration via HTTP transport</li>
              <li>Created dual personality modes (professional & GenZ) with temperature control</li>
              <li>Optimized token usage by ~25% through prompt engineering (1k-2.5k tokens)</li>
              <li>Enhanced conversation context for follow-up question understanding</li>
              <li>Deployed on Vercel Edge with global CDN distribution</li>
            </ul>
          </StarCard>

          <StarCard letter="R" title="Result">
            <div className="space-y-2">
              <p>
                Delivered production-ready AI portfolio with &lt;3s response time and 75% minimum 
                RAG relevance. System handles professional inquiries with context-aware responses 
                and supports Claude Desktop integration via MCP.
              </p>
              <div className="grid md:grid-cols-3 gap-2 text-xs">
                <div className="rounded-md bg-muted p-2">
                  <p className="font-semibold">↑60%</p>
                  <p className="text-muted-foreground">Response Quality</p>
                </div>
                <div className="rounded-md bg-muted p-2">
                  <p className="font-semibold">↓~25%</p>
                  <p className="text-muted-foreground">Token Usage</p>
                </div>
                <div className="rounded-md bg-muted p-2">
                  <p className="font-semibold">&lt;3s</p>
                  <p className="text-muted-foreground">Response Time</p>
                </div>
              </div>
            </div>
          </StarCard>
        </div>
      </section>

      {/* Person Search Application */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Database className="w-6 h-6" />
          Person Search System with OAuth
        </h2>
        <div className="rounded-lg border p-6 space-y-4">
          <StarCard letter="S" title="Situation">
            <p>
              Organization needed secure person directory with role-based access control and advanced 
              search capabilities across multiple data fields.
            </p>
          </StarCard>

          <StarCard letter="T" title="Task">
            <p>
              Develop full-stack application with OAuth 2.0 authentication, PostgreSQL database, 
              and real-time search/filtering functionality for efficient person data management.
            </p>
          </StarCard>

          <StarCard letter="A" title="Action">
            <ul className="space-y-1 list-disc list-inside">
              <li>Implemented OAuth 2.0 flow with NextAuth.js for secure authentication</li>
              <li>Designed PostgreSQL schema with Prisma ORM for type-safe queries</li>
              <li>Built advanced filtering system with multiple criteria combinations</li>
              <li>Created responsive UI with real-time search and sorting</li>
              <li>Implemented session management with secure cookie handling</li>
              <li>Added pagination for performance with large datasets</li>
            </ul>
          </StarCard>

          <StarCard letter="R" title="Result">
            <p>
              Deployed secure application handling 1000+ person records with sub-second search performance. 
              OAuth integration ensures authorized access only, while advanced filtering enables precise 
              data retrieval across multiple fields.
            </p>
          </StarCard>
        </div>
      </section>

      {/* RAG System Optimization */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          RAG System Performance Optimization
        </h2>
        <div className="rounded-lg border p-6 space-y-4">
          <StarCard letter="S" title="Situation">
            <p>
              Initial AI responses were generic ("I can answer questions about...") and follow-up 
              questions failed to understand context. Token usage was high (1k-3.5k per request), 
              impacting latency and cost.
            </p>
          </StarCard>

          <StarCard letter="T" title="Task">
            <p>
              Eliminate hardcoded responses, improve follow-up understanding, reduce token usage, 
              and enhance overall response quality while maintaining sub-3s response times.
            </p>
          </StarCard>

          <StarCard letter="A" title="Action">
            <ul className="space-y-1 list-disc list-inside">
              <li>Refactored 50+ hardcoded FAQ responses to 10 dynamic context hint patterns</li>
              <li>Enhanced system prompt with bad/good examples to prevent generic responses</li>
              <li>Implemented conversation context tracking with pronoun resolution rules</li>
              <li>Optimized mood prompts from 1.2k-2.8k to 400-600 characters (40% reduction)</li>
              <li>Designed conversation flow with progressive fallback states</li>
              <li>Tuned RAG threshold from 0.4 to 0.75 (with 0.65 fallback) for better quality-coverage balance</li>
              <li>Simplified validation patterns from 9 to 4 (50% reduction)</li>
              <li>Implemented Set-based slang lookup (O(1) vs O(n) performance)</li>
            </ul>
          </StarCard>

          <StarCard letter="R" title="Result">
            <div className="space-y-2">
              <p>
                Achieved 60% improvement in response quality with specific, context-aware answers. 
                Follow-up questions now work correctly with improved accuracy. Token usage optimized to 1k-2.5k tokens 
                (from 1.5k-3k before), improving cost efficiency and response speed.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="rounded-md bg-green-50 dark:bg-green-950 p-2">
                  <p className="font-semibold text-green-700 dark:text-green-300">↑60%</p>
                  <p className="text-green-600 dark:text-green-400">Response Quality</p>
                </div>
                <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-2">
                  <p className="font-semibold text-blue-700 dark:text-blue-300">↑80%</p>
                  <p className="text-blue-600 dark:text-blue-400">Follow-up Accuracy</p>
                </div>
                <div className="rounded-md bg-purple-50 dark:bg-purple-950 p-2">
                  <p className="font-semibold text-purple-700 dark:text-purple-300">↓40%</p>
                  <p className="text-purple-600 dark:text-purple-400">Token Usage</p>
                </div>
                <div className="rounded-md bg-orange-50 dark:bg-orange-950 p-2">
                  <p className="font-semibold text-orange-700 dark:text-orange-300">~80%</p>
                  <p className="text-orange-600 dark:text-orange-400">RAG Relevance</p>
                </div>
              </div>
            </div>
          </StarCard>
        </div>
      </section>

      {/* MCP Integration */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Target className="w-6 h-6" />
          Model Context Protocol Integration
        </h2>
        <div className="rounded-lg border p-6 space-y-4">
          <StarCard letter="S" title="Situation">
            <p>
              AI agents like Claude Desktop needed standardized way to access portfolio information 
              without manual API integration for each tool.
            </p>
          </StarCard>

          <StarCard letter="T" title="Task">
            <p>
              Implement MCP server with HTTP transport allowing Claude Desktop and compatible clients 
              to query digital twin through standardized tool calling interface.
            </p>
          </StarCard>

          <StarCard letter="A" title="Action">
            <ul className="space-y-1 list-disc list-inside">
              <li>Created MCP handler at /api/[transport]/route.ts with POST/OPTIONS methods</li>
              <li>Defined chat_with_digital_twin tool with Zod schema validation</li>
              <li>Implemented mood parameter support (professional/genz)</li>
              <li>Added session management for conversation continuity</li>
              <li>Deployed to Vercel Edge with global endpoint</li>
              <li>Fixed CORS headers for cross-origin requests</li>
              <li>Configured Claude Desktop integration via JSON config</li>
            </ul>
          </StarCard>

          <StarCard letter="R" title="Result">
            <p>
              Successfully deployed MCP server at https://m-njp.vercel.app/api/mcp accessible to 
              Claude Desktop and other MCP clients. System handles tool calls with streaming responses, 
              session persistence, and dual personality modes.
            </p>
          </StarCard>
        </div>
      </section>

      {/* Skills Demonstration */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Award className="w-6 h-6" />
          Skills Demonstrated Across Projects
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-3 text-sm">Technical Skills</h3>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Full-Stack Development</p>
                  <p className="text-muted-foreground">Next.js, React, TypeScript, PostgreSQL</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">AI & Machine Learning</p>
                  <p className="text-muted-foreground">RAG, Vector Databases, LLM Integration</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Authentication & Security</p>
                  <p className="text-muted-foreground">OAuth 2.0, Session Management, CORS</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Database Design</p>
                  <p className="text-muted-foreground">Schema Design, Prisma ORM, Vector Search</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-3 text-sm">Soft Skills</h3>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Problem Solving</p>
                  <p className="text-muted-foreground">Systematic debugging, root cause analysis</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Performance Optimization</p>
                  <p className="text-muted-foreground">40% token reduction, sub-3s responses</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Documentation</p>
                  <p className="text-muted-foreground">Clear commit messages, comprehensive docs</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Iterative Development</p>
                  <p className="text-muted-foreground">Continuous testing, quality improvements</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Data Source */}
      <section>
        <div className="rounded-lg border bg-muted/50 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-5 h-5" />
            <h3 className="font-semibold">Knowledge Base Source</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            All STAR methodology examples are embedded as 38 semantic chunks in Upstash Vector database 
            from <code className="text-xs bg-muted px-1 py-0.5 rounded">data/digitaltwin.json</code>. 
            The RAG system retrieves relevant achievements based on query context, enabling natural 
            conversation about professional experience.
          </p>
        </div>
      </section>
    </div>
  );
}

