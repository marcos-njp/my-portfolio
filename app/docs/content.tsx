"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Cpu, Zap, Plug, TestTube, AlertCircle, Github, Database, ArrowRight } from "lucide-react";
import {
  RagArchitectureSection,
  AdvancedFeaturesSection,
  McpIntegrationSection,
  TestingSection,
  OperationsSection,
  ProfileDataSection,
  GithubSection,
} from "@/components/docs/sections";

const sections = [
  {
    title: "RAG Architecture",
    href: "/docs?section=rag-architecture",
    icon: Cpu,
    description: "Deep dive into the RAG system: Groq AI integration, Upstash Vector database, semantic search, and streaming responses.",
  },
  {
    title: "Advanced Features",
    href: "/docs?section=advanced-features",
    icon: Zap,
    description: "Personality modes, session memory, query preprocessing, feedback detection, and response optimization.",
  },
  {
    title: "MCP Integration",
    href: "/docs?section=mcp-integration",
    icon: Plug,
    description: "Model Context Protocol setup, tool calling functionality, and Claude Desktop integration.",
  },
  {
    title: "Testing & Evolution",
    href: "/docs?section=testing",
    icon: TestTube,
    description: "AI improvements: streaming UX, follow-up understanding, feedback implementation, and performance optimization.",
  },
  {
    title: "Operations",
    href: "/docs?section=operations",
    icon: AlertCircle,
    description: "Troubleshooting guide with common errors, solutions, and lessons learned from development.",
  },
  {
    title: "GitHub Repositories",
    href: "/docs?section=github",
    icon: Github,
    description: "All project repositories with descriptions, tech stacks, and live demo links.",
  },
  {
    title: "Profile Data",
    href: "/docs?section=profile-data",
    icon: Database,
    description: "STAR methodology examples and structured professional profile organization.",
  },
];

export default function DocsContent() {
  const searchParams = useSearchParams();
  const section = searchParams.get("section");

  const renderSection = () => {
    switch (section) {
      case "rag-architecture":
        return <RagArchitectureSection />;
      case "advanced-features":
        return <AdvancedFeaturesSection />;
      case "mcp-integration":
        return <McpIntegrationSection />;
      case "testing":
        return <TestingSection />;
      case "operations":
        return <OperationsSection />;
      case "profile-data":
        return <ProfileDataSection />;
      case "github":
        return <GithubSection />;
      default:
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-3">Documentation</h1>
              <p className="text-xl text-muted-foreground">
                Comprehensive technical documentation for the AI-powered digital twin portfolio system.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-2">About This Portfolio</h2>
              <p className="text-sm text-muted-foreground mb-4">
                This is a production-ready Next.js 15 portfolio featuring an AI digital twin powered by Retrieval-Augmented Generation (RAG). 
                The system uses Groq AI with the llama-3.1-8b-instant model and Upstash Vector for semantic search, enabling real-time responses 
                to professional queries with high accuracy.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium">Framework</p>
                  <p className="text-muted-foreground">Next.js 15</p>
                </div>
                <div>
                  <p className="font-medium">AI Model</p>
                  <p className="text-muted-foreground">Groq AI (llama-3.1-8b)</p>
                </div>
                <div>
                  <p className="font-medium">Vector DB</p>
                  <p className="text-muted-foreground">Upstash Vector</p>
                </div>
                <div>
                  <p className="font-medium">Deployment</p>
                  <p className="text-muted-foreground">Vercel Edge</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Explore Documentation</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <Link
                      key={section.href}
                      href={section.href}
                      className="group relative rounded-lg border p-6 hover:border-primary transition-colors"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="rounded-md bg-primary/10 p-2">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-semibold">{section.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {section.description}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-primary font-medium group-hover:gap-2 transition-all">
                        Read more <ArrowRight className="w-3 h-3" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border bg-muted/50 p-6">
              <h2 className="text-lg font-semibold mb-2">Quick Links</h2>
              <div className="grid gap-2 text-sm">
                <Link href="/" className="text-primary hover:underline">
                  ← Back to Portfolio Homepage
                </Link>
                <Link href="https://github.com/marcos-njp/my-portfolio" className="text-primary hover:underline" target="_blank">
                  View Source Code on GitHub ↗
                </Link>
                <Link href="https://m-njp.vercel.app" className="text-primary hover:underline" target="_blank">
                  Live Demo ↗
                </Link>
              </div>
            </div>
          </div>
        );
    }
  };

  return renderSection();
}
