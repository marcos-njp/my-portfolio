"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllMoods, type AIMood } from "@/lib/ai-moods";
import { X, Sparkles, Send, Loader2, User } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function ChatSidebar({ isOpen, onClose }: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm Niño's AI digital twin, powered by advanced RAG technology. Ask me about his technical skills, projects, education, achievements, or career goals. I'm trained on 50+ common interview questions!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentMood, setCurrentMood] = useState<AIMood>("professional");
  
  // Persistent sessionId using localStorage (survives page refresh)
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ai_chat_session_id');
      if (stored) {
        console.log('[Session] Restored existing session:', stored);
        return stored;
      }
    }
    const newId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_chat_session_id', newId);
    }
    console.log('[Session] Created new session:', newId);
    return newId;
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get all available moods
  const moods = getAllMoods();

  console.log(`[Session] ID: ${sessionId}, Mood: ${currentMood}`);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Log mood changes
  useEffect(() => {
    console.log(`[Mood Change] New mood: ${currentMood}`);
  }, [currentMood]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    console.log(`[API Call] Sending with mood: ${currentMood}, sessionId: ${sessionId}`);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          mood: currentMood, // Pass current mood to API
          sessionId: sessionId, // Pass session ID for memory
        }),
      });

      // Handle validation errors (400 status)
      if (response.status === 400) {
        const errorData = await response.json()
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: errorData.message || "Please ask about my professional background, skills, or projects.",
          },
        ])
        setIsLoading(false)
        return
      }

      if (!response.ok) throw new Error("Failed to get response")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let aiResponse = ""

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk as plain text (toTextStreamResponse sends plain text)
        const text = decoder.decode(value, { stream: true });
        aiResponse += text;
        
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id ? { ...m, content: aiResponse } : m
          )
        );
      }

      console.log(`[Response Complete] Mood was: ${currentMood}`);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Suggested questions - Common interviewer questions
  const suggestions = [
    "Tell me about yourself",
    "What are your technical skills?",
    "Describe your most challenging project",
    "Why should we hire you?",
  ]

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => {
      const form = document.querySelector("form");
      if (form) {
        const event = new Event("submit", { bubbles: true, cancelable: true });
        form.dispatchEvent(event);
      }
    }, 100);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[440px] bg-background border-l shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">AI Digital Twin</h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Online • Powered by Groq AI
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Mood Selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">AI Personality Mode:</label>
              <Select value={currentMood} onValueChange={(value) => setCurrentMood(value as AIMood)}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {moods.find(m => m.id === currentMood)?.icon} {moods.find(m => m.id === currentMood)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {moods.map((mood) => (
                    <SelectItem key={mood.id} value={mood.id}>
                      <div className="flex items-center gap-2">
                        <span>{mood.icon}</span>
                        <div>
                          <div className="font-medium">{mood.name}</div>
                          <div className="text-xs text-muted-foreground">{mood.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Suggested Questions */}
            {messages.length === 1 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">💡 Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                )}
                
                <div
                  className={`max-w-[85%] rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>

                {message.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="max-w-[85%] rounded-lg p-4 bg-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
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
        </div>
      </div>
    </>
  )
}
