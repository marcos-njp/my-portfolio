import { Github, ExternalLink, Star, Code, Globe } from "lucide-react";

export function GithubSection() {
  const projects = [
    {
      name: "AI-Powered Portfolio",
      description: "Digital twin portfolio with RAG, MCP integration, and intelligent conversation system featuring personality modes, session memory, and semantic search.",
      tech: ["Next.js 15", "TypeScript", "Groq AI", "Upstash Vector", "Upstash Redis", "Vercel AI SDK", "Tailwind CSS"],
      github: "https://github.com/marcos-njp/my-portfolio-main-project",
      demo: "https://m-njp.vercel.app",
      highlights: [
        "38 embedded knowledge chunks with STAR methodology",
        "MCP server for Claude Desktop integration",
        "Professional & GenZ personality modes",
        "~25% token optimization (1k-2.5k per request)",
        "Follow-up question understanding with pronouns",
        "Copy & feedback mechanisms for UX"
      ]
    },
    {
      name: "Person Search Application",
      description: "Full-stack person directory with OAuth authentication, advanced filtering, sorting, and secure data management using PostgreSQL.",
      tech: ["Next.js", "TypeScript", "OAuth 2.0", "PostgreSQL", "Prisma ORM", "NextAuth.js", "Tailwind CSS"],
      github: "https://github.com/marcos-njp/person-search",
      demo: "https://m-njp-person-search.vercel.app/",
      highlights: [
        "OAuth 2.0 authentication flow",
        "Advanced search with multiple filters",
        "Real-time sorting and pagination",
        "Secure session management",
        "Responsive design with accessibility",
        "Database schema with relationships"
      ]
    },
    {
      name: "Modern Portfolio Website",
      description: "Responsive portfolio showcasing projects, skills, and experience with dark mode support and smooth animations.",
      tech: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Framer Motion", "Vercel"],
      github: "https://github.com/marcos-njp/modern-portfolio",
      demo: "https://marcos-portfolio.vercel.app",
      highlights: [
        "Smooth scroll animations with Framer Motion",
        "Dark/light theme toggle",
        "Project showcase with modals",
        "Contact form with validation",
        "Fully responsive design",
        "Optimized performance (90+ Lighthouse)"
      ]
    },
    {
      name: "AI Agent Development Setup",
      description: "Comprehensive development environment setup with MCP server integration, AI tools, and automated workflows for agent development.",
      tech: ["Python", "Node.js", "Docker", "MCP", "Claude AI", "VS Code Extensions"],
      github: "https://github.com/marcos-njp/ai-agent-setup",
      demo: null,
      highlights: [
        "MCP server configuration templates",
        "Docker containerization for consistency",
        "VS Code workspace settings",
        "AI tool integration guides",
        "Automated testing workflows",
        "Documentation and best practices"
      ]
    },
    {
      name: "Movie Discovery App",
      description: "Interactive movie browsing application with search, filtering, and detailed movie information using TMDB API.",
      tech: ["React", "JavaScript", "TMDB API", "CSS3", "Local Storage"],
      github: "https://github.com/marcos-njp/movie-app",
      demo: null,
      highlights: [
        "TMDB API integration for real-time data",
        "Advanced search and filtering",
        "Movie details with ratings and reviews",
        "Favorite movies with local storage",
        "Responsive grid layout",
        "Infinite scroll pagination"
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">GitHub Repositories</h1>
        <p className="text-xl text-muted-foreground">
          Comprehensive showcase of projects demonstrating full-stack development, AI integration, and modern web technologies.
        </p>
      </div>

      {/* GitHub Profile Stats */}
      <section>
        <div className="rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Github className="w-6 h-6" />
            <h2 className="text-2xl font-semibold">GitHub Profile</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div className="rounded-md bg-muted p-4 text-center">
              <Star className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">5+</p>
              <p className="text-xs text-muted-foreground">Public Repositories</p>
            </div>
            <div className="rounded-md bg-muted p-4 text-center">
              <Code className="w-5 h-5 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">TypeScript</p>
              <p className="text-xs text-muted-foreground">Primary Language</p>
            </div>
            <div className="rounded-md bg-muted p-4 text-center">
              <Globe className="w-5 h-5 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">3</p>
              <p className="text-xs text-muted-foreground">Live Deployments</p>
            </div>
            <div className="rounded-md bg-muted p-4 text-center">
              <Github className="w-5 h-5 mx-auto mb-2" />
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
          {projects.map((project, index) => (
            <div key={index} className="rounded-lg border p-6 hover:border-primary transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-md hover:bg-muted transition-colors"
                    aria-label="View GitHub repository"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                  {project.demo && (
                    <a
                      href={project.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md hover:bg-muted transition-colors"
                      aria-label="View live demo"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Tech Stack */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">TECH STACK</p>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Highlights */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">KEY FEATURES</p>
                <ul className="grid md:grid-cols-2 gap-2 text-sm">
                  {project.highlights.map((highlight, highlightIndex) => (
                    <li key={highlightIndex} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span className="text-muted-foreground">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Links */}
              <div className="flex gap-3 mt-4 pt-4 border-t">
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <Github className="w-4 h-4" />
                  View Code
                </a>
                {project.demo && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <a
                      href={project.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Live Demo
                    </a>
                  </>
                )}
              </div>
            </div>
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
              <li>• Next.js 15 (App Router)</li>
              <li>• React with TypeScript</li>
              <li>• Tailwind CSS</li>
              <li>• Framer Motion</li>
              <li>• Shadcn UI Components</li>
            </ul>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-3 text-sm">Backend & AI</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Groq AI (llama-3.1-8b-instant)</li>
              <li>• Upstash Vector (RAG)</li>
              <li>• Upstash Redis (Sessions)</li>
              <li>• PostgreSQL with Prisma</li>
              <li>• OAuth 2.0 & NextAuth.js</li>
            </ul>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-3 text-sm">DevOps & Tools</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Vercel Edge Runtime</li>
              <li>• Docker Containerization</li>
              <li>• Git Version Control</li>
              <li>• MCP Protocol Integration</li>
              <li>• VS Code Extensions</li>
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
            <a
              href="/#contact"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-muted transition-colors text-sm"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
