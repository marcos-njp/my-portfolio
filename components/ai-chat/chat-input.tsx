"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { type AIMood } from "@/lib/ai-moods";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  mood?: AIMood;
  placeholder?: string;
  [key: string]: unknown; // Allow additional props like data-chat-form
}

export function ChatInput({ 
  value, 
  onChange, 
  onSubmit, 
  isLoading, 
  mood = 'professional',
  placeholder = "Ask me anything...",
  ...restProps 
}: ChatInputProps) {
  // Subtle border colors for different moods
  const borderColor = mood === 'genz' 
    ? 'focus-visible:ring-purple-500 focus-visible:border-purple-500' 
    : 'focus-visible:ring-blue-500 focus-visible:border-blue-500';

  return (
    <div className="border-t p-4">
      <form onSubmit={onSubmit} className="flex gap-2" {...restProps}>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className={`flex-1 transition-all duration-300 ${borderColor}`}
        />
        <Button type="submit" size="icon" disabled={isLoading || !value.trim()}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Powered by Groq AI • Upstash Vector RAG
      </p>
    </div>
  );
}
