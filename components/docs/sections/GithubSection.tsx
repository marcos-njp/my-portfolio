import Link from "next/link";
import { Github, ExternalLink, Star, Code, Globe } from "lucide-react";
import { DocPageLayout, GithubProjectCard } from "@/components/docs/common";
import { githubProjects } from "@/data/docs";

export function GithubSection() {
  return (
    <DocPageLayout
      title="GitHub Repositories"
      subtitle="Comprehensive showcase of projects demonstrating full-stack development, AI integration, and modern web technologies."
    >

      {/* GitHub Profile Stats */}
      <section>
        <div className="rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Github className="w-6 h-6" />
            <h2 className="text-2xl font-semibold">GitHub Profile</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div className="rounded-md bg-secondary p-4 text-center">
              <Star className="w-5 h-5 mx-auto mb-2 text-foreground" strokeWidth={1.75} />
              <p className="text-2xl font-medium">5+</p>
              <p className="text-xs text-muted-foreground">Public Repositories</p>
            </div>
            <div className="rounded-md bg-secondary p-4 text-center">
              <Code className="w-5 h-5 mx-auto mb-2 text-foreground" strokeWidth={1.75} />
              <p className="text-2xl font-medium">TypeScript</p>
              <p className="text-xs text-muted-foreground">Primary Language</p>
            </div>
            <div className="rounded-md bg-secondary p-4 text-center">
              <Globe className="w-5 h-5 mx-auto mb-2 text-foreground" strokeWidth={1.75} />
              <p className="text-2xl font-medium">3</p>
              <p className="text-xs text-muted-foreground">Live Deployments</p>
            </div>
            <div className="rounded-md bg-secondary p-4 text-center">
              <Github className="w-5 h-5 mx-auto mb-2" strokeWidth={1.75} />
              <a
                href="https://github.com/marcos-njp" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-semibold text-primary hover:underline"
              >
                @marcos-njp
              </a>
              <p className="text-xs text-muted-foreground">GitHub Profile</p>
            </div>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Featured Projects</h2>
        <div className="space-y-6">
          {githubProjects.map((project, index) => (
            <GithubProjectCard key={index} {...project} />
          ))}
        </div>
      </section>

      {/* Tech Stack Overview */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Technology Overview</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-3 text-sm">Frontend</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Next.js 16 (App Router)</li>
              <li>• React with TypeScript</li>
              <li>• Tailwind CSS</li>
              <li>• Framer Motion</li>
              <li>• Shadcn UI Components</li>
            </ul>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-3 text-sm">Backend & AI</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Groq AI (llama-3.3-70b-versatile)</li>
              <li>• Upstash Vector (RAG)</li>
              <li>• Upstash Redis (Sessions)</li>
              <li>• Firebase & NoSQL</li>
              <li>• MCP server integration</li>
            </ul>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-3 text-sm">DevOps & Tools</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Vercel deployment</li>
              <li>• Cloudflare R2 storage</li>
              <li>• Laravel Cloud</li>
              <li>• Git & GitHub</li>
              <li>• Agentic AI tooling</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Contribution Activity */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Development Activity</h2>
        <div className="rounded-lg border p-6">
          <p className="text-sm text-muted-foreground mb-4">
            Active development across multiple projects with consistent commits, documentation, and iterative improvements.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-md bg-muted p-4">
              <h3 className="font-semibold mb-2">Recent Focus Areas</h3>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• AI system optimization (token reduction, RAG tuning)</li>
                <li>• MCP server implementation and deployment</li>
                <li>• UX enhancements (streaming, feedback, copy buttons)</li>
                <li>• Documentation and testing improvements</li>
                <li>• Conversation context and follow-up handling</li>
              </ul>
            </div>
            <div className="rounded-md bg-muted p-4">
              <h3 className="font-semibold mb-2">Commit Highlights</h3>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Refactored FAQ system from hardcoded to dynamic</li>
                <li>• Fixed mood enum consistency across MCP handlers</li>
                <li>• Optimized response validation with Set-based lookup</li>
                <li>• Enhanced system prompts with examples</li>
                <li>• Implemented comprehensive documentation system</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <a
              href="https://github.com/marcos-njp/my-portfolio-main-project/commits/main/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <Github className="w-4 h-4" />
              View Full Commit History
            </a>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section>
        <div className="rounded-lg border bg-muted/50 p-6 text-center">
          <h3 className="font-semibold mb-2">Interested in Collaboration?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Explore the repositories, try the live demos, or reach out to discuss potential projects.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="https://github.com/marcos-njp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
            >
              <Github className="w-4 h-4" />
              Follow on GitHub
            </a>
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-muted transition-colors text-sm"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </DocPageLayout>
  );
}
