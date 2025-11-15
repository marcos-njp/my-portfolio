"use client";

import { Button } from "@/components/ui/button";
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
      description: "Uses Groq AI with llama-3.1-8b-instant model for fast, intelligent responses about my background, skills, and projects.",
    },
    {
      icon: Sparkles,
      title: "Dual Personality Modes",
      description: "Switch between Professional mode for formal responses and GenZ mode for casual, friendly conversations.",
    },
    {
      icon: MessageSquare,
      title: "RAG Architecture",
      description: "Retrieval-Augmented Generation with Upstash Vector Database searches 38 knowledge chunks with 75% relevance threshold.",
    },
    {
      icon: Zap,
      title: "Real-Time Streaming",
      description: "Responses stream in real-time using Vercel AI SDK for a smooth, interactive experience.",
    },
    {
      icon: Shield,
      title: "Session Memory",
      description: "Remembers conversation context with Upstash Redis for more natural, contextual responses.",
    },
    {
      icon: Globe,
      title: "Query Processing",
      description: "Advanced query validation, preprocessing, and feedback detection ensure relevant, helpful responses.",
    },
  ];

  const capabilities = [
    "Answer questions about my technical skills and experience",
    "Explain my projects and their technical implementations",
    "Discuss my competition achievements and background",
    "Provide information about my education and career goals",
    "Share insights about my work style and personality",
    "Switch between professional and casual conversation modes",
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 hover:bg-primary/20 hover:text-primary dark:hover:bg-primary/30 dark:hover:text-primary-foreground transition-colors"
        >
          <Info className="h-3.5 w-3.5" />
          Features
        </Button>
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
                  <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-4 w-4 text-primary" />
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
                "llama-3.1-8b-instant",
                "Upstash Vector",
                "Upstash Redis",
                "Vercel AI SDK",
                "Next.js 15",
                "TypeScript",
              ].map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Usage Tips */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <h3 className="font-semibold mb-2 text-sm">💡 Tips for Best Results</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Ask specific questions about my skills, projects, or experience</li>
              <li>• Try different personality modes for varied response styles</li>
              <li>• Questions are processed with semantic search for accuracy</li>
              <li>• Session memory helps maintain conversation context</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
