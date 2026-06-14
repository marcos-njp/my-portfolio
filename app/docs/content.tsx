"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  RagArchitectureSection,
  McpIntegrationSection,
  ProfileDataSection,
  GithubSection,
  LibUtilitiesSection,
  PersonalitySystemSection,
  AdvancedFeaturesSection,
  CompanionProcessingSection,
} from "@/components/docs/sections";

const sections = [
  {
    index: "01",
    title: "Retrieval & Response Flow",
    href: "/docs?section=rag-architecture",
    description: "The retrieval pipeline: Groq, Upstash Vector, semantic validation, and streamed answers.",
  },
  {
    index: "02",
    title: "Lib Utilities",
    href: "/docs?section=lib-utilities",
    description: "The lib/ modules: query processing, validation, retrieval, session memory, and the AI voice.",
  },
  {
    index: "03",
    title: "Personality System",
    href: "/docs?section=personality-system",
    description: "How personality.json drives a humble, concise voice and persona-aware error handling.",
  },
  {
    index: "04",
    title: "Advanced Features",
    href: "/docs?section=advanced-features",
    description: "Dual storage, persona-aware errors, semantic validation, and the Digital Niño companion.",
  },
  {
    index: "05",
    title: "MCP Integration",
    href: "/docs?section=mcp-integration",
    description: "Model Context Protocol setup, tool calling, and Claude Desktop integration.",
  },
  {
    index: "06",
    title: "GitHub Repositories",
    href: "/docs?section=github",
    description: "Current repositories with descriptions, tech stacks, and demo links.",
  },
  {
    index: "07",
    title: "Profile Data",
    href: "/docs?section=profile-data",
    description: "STAR-methodology examples and how the knowledge base is structured.",
  },
  {
    index: "08",
    title: "Companion & Prompt Flow",
    href: "/docs?section=companion-processing",
    description: "How the robot companion syncs with thinking state, streaming, and the validation-first prompt pipeline.",
  },
];

const SPECS = [
  { label: "Framework", value: "Next.js 16" },
  { label: "AI Model", value: "Groq · llama-3.3-70b" },
  { label: "Vector DB", value: "Upstash Vector" },
  { label: "Deployment", value: "Vercel" },
];

export default function DocsContent() {
  const searchParams = useSearchParams();
  const section = searchParams.get("section");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [section]);

  switch (section) {
    case "rag-architecture":
      return <RagArchitectureSection />;
    case "lib-utilities":
      return <LibUtilitiesSection />;
    case "personality-system":
      return <PersonalitySystemSection />;
    case "advanced-features":
      return <AdvancedFeaturesSection />;
    case "mcp-integration":
      return <McpIntegrationSection />;
    case "profile-data":
      return <ProfileDataSection />;
    case "github":
      return <GithubSection />;
    case "companion-processing":
      return <CompanionProcessingSection />;
  }

  return (
    <div className="space-y-10">
      {/* Hero */}
      <header className="border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <span className="nm-display text-primary text-xl leading-none">00</span>
          <span className="nm-label">system docs</span>
        </div>
        <h1 className="mt-3 text-3xl md:text-4xl font-medium tracking-tight">AI Portfolio Systems</h1>
        <p className="mt-2 text-base text-muted-foreground max-w-2xl leading-relaxed">
          A clean walkthrough of the AI digital twin: retrieval, validation, orchestration, memory, and the companion UI.
        </p>
      </header>

      {/* Overview */}
      <div className="rounded-md border border-border bg-card p-6">
        <h2 className="text-lg font-medium tracking-tight mb-2">About this portfolio</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          A production Next.js portfolio featuring an AI digital twin powered by Retrieval-Augmented Generation (RAG).
          It runs Groq AI (<code className="font-mono text-xs">llama-3.3-70b-versatile</code>) over an Upstash Vector store
          for semantic search, with persona-aware error handling, a dual storage system (session memory + chat history),
          smart suggested questions, semantic query validation, and a synchronized robot companion.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border rounded-md overflow-hidden">
          {SPECS.map((s) => (
            <div key={s.label} className="bg-card p-4">
              <p className="nm-label-sm mb-1.5">{s.label}</p>
              <p className="text-sm font-medium">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Explore */}
      <div>
        <h2 className="text-xl font-medium tracking-tight mb-4">Explore documentation</h2>
        <div className="grid gap-px bg-border border border-border rounded-md overflow-hidden md:grid-cols-2">
          {sections.map((s) => (
            <Link key={s.href} href={s.href} className="group bg-card p-6 transition-colors hover:bg-secondary">
              <span className="nm-display text-primary text-2xl leading-none">{s.index}</span>
              <h3 className="font-medium tracking-tight mb-1.5 mt-3">{s.title}</h3>
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{s.description}</p>
              <span className="nm-label flex items-center gap-1.5 group-hover:text-foreground transition-colors">
                read more →
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-md border border-border bg-card p-6">
          <p className="nm-label mb-3">quick links</p>
          <div className="grid gap-2.5 text-sm">
            <Link href="/" className="hover:text-foreground text-muted-foreground transition-colors">← Back to portfolio</Link>
            <Link href="https://github.com/marcos-njp/my-portfolio" target="_blank" className="hover:text-foreground text-muted-foreground transition-colors">Source code on GitHub ↗</Link>
            <Link href="https://m-njp.vercel.app" target="_blank" className="hover:text-foreground text-muted-foreground transition-colors">Live demo ↗</Link>
          </div>
        </div>
        <div className="rounded-md border border-border bg-card p-6">
          <p className="nm-label mb-3">external resources</p>
          <div className="grid gap-2.5 text-sm">
            <a href="https://nextjs.org/docs" target="_blank" rel="noopener noreferrer" className="hover:text-foreground text-muted-foreground transition-colors">Next.js documentation ↗</a>
            <a href="https://tailwindcss.com/docs" target="_blank" rel="noopener noreferrer" className="hover:text-foreground text-muted-foreground transition-colors">Tailwind CSS docs ↗</a>
            <a href="https://upstash.com/docs/vector" target="_blank" rel="noopener noreferrer" className="hover:text-foreground text-muted-foreground transition-colors">Upstash Vector docs ↗</a>
            <a href="https://console.groq.com/docs" target="_blank" rel="noopener noreferrer" className="hover:text-foreground text-muted-foreground transition-colors">Groq API docs ↗</a>
          </div>
        </div>
      </div>
    </div>
  );
}
