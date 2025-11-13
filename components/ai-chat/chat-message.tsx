"use client";

import { Sparkles, User, Loader2 } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  error?: string;
}

export function ChatMessage({ role, content, isStreaming = false, error }: ChatMessageProps) {
  const isThinking = role === "assistant" && (content.startsWith('Thinking') || content.startsWith('Processing') || content.startsWith('Almost'));
  
  return (
    <div className={`flex gap-3 ${role === "user" ? "justify-end" : "justify-start"}`}>
      {role === "assistant" && (
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
          {isThinking ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 text-primary" />
          )}
        </div>
      )}
      
      <div
        className={`max-w-[85%] rounded-lg p-4 ${
          role === "user" 
            ? "bg-primary text-primary-foreground" 
            : error 
            ? "bg-destructive/10 border border-destructive/20"
            : "bg-muted"
        }`}
      >
        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
          error ? "text-destructive" : ""
        } ${isThinking ? "flex items-center gap-2" : ""}`}>
          {isThinking && <Loader2 className="w-4 h-4 animate-spin inline" />}
          {content}
        </p>
        
        {isStreaming && role === "assistant" && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-current rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
            <span>Generating...</span>
          </div>
        )}
        
        {error && (
          <div className="mt-2 text-xs text-destructive/70">
            Error: {error}
          </div>
        )}
      </div>

      {role === "user" && (
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}
