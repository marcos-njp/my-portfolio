"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bot, Sparkles, MessageSquare, Zap, Shield, Globe, Info } from "lucide-react";

export function ChatFeaturesModal() {
  const features = [
    {
      icon: Bot,
      title: "AI-Powered Responses",
      description: "Uses Groq AI with llama-3.3-70b-versatile model for fast, intelligent responses about my background, skills, and projects.",
    },
    {
      icon: Sparkles,
      title: "Persona-Aware System",
      description: "Professional/GenZ modes with mood-aware error handling. Smart suggested questions adapt to conversation context.",
    },
    {
      icon: MessageSquare,
      title: "Retrieval & Response Flow",
      description: "Retrieval-Augmented Generation with Upstash Vector searches the knowledge base with a 75% relevance threshold.",
    },
    {
      icon: Zap,
      title: "Real-Time Streaming",
      description: "Responses stream in real-time using Vercel AI SDK for a smooth, interactive experience.",
    },
    {
      icon: Shield,
      title: "Dual Storage System",
      description: "Session memory (8 messages for AI context) + complete chat history (UI display). Auto-clears after 1 hour.",
    },
    {
      icon: Globe,
      title: "Semantic Validation",
      description: "Regex-pattern validation with suggestion whitelisting. Persona-aware error responses replace hardcoded messages.",
    },
  ];

  const capabilities = [
    "Answer questions about my technical skills and experience",
    "Explain my projects and their technical implementations",
    "Discuss my competition achievements and background",
    "Provide information about my education and career goals",
    "Share insights about my work style and personality",
    "Switch between professional and casual conversation modes",
    "Provide smart suggested questions with localStorage persistence",
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="nm-link nm-hover">
          <Info className="w-3.5 h-3.5" /> features
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Digital Twin Features
          </DialogTitle>
          <DialogDescription>
            Learn about the capabilities and technology behind this AI assistant
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Features Grid */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">Core Features</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
                    <feature.icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm mb-1">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Capabilities List */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">What I Can Do</h3>
            <div className="space-y-2">
              {capabilities.map((capability, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                  <p className="text-muted-foreground">{capability}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">Technology Stack</h3>
            <div className="flex flex-wrap gap-2">
              {[
                "Groq AI",
                "llama-3.3-70b-versatile",
                "Upstash Vector",
                "Upstash Redis",
                "Vercel AI SDK",
                "Next.js 16",
                "TypeScript",
              ].map((tech) => (
                <span
                  key={tech}
                  className="font-mono text-[11px] tracking-wide border border-border rounded-full px-3 py-1"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Usage Tips */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <h3 className="font-semibold mb-2 text-sm">Tips for Best Results</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Use smart suggested questions for guided conversation flow</li>
              <li>• Try personality modes - error messages adapt to selected mood</li>
              <li>• Session memory maintains context, chat history shows full conversation</li>
              <li>• Semantic validation improves query understanding and accuracy</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
