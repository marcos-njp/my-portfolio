"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { type AIMood } from "@/lib/ai-moods";
import { X, Sparkles, Loader2 } from "lucide-react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { MoodSelector } from "./mood-selector";
import { SuggestedQuestions } from "./suggested-questions";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTIONS = [
  "What are your top skills?",
  "Tell me about your projects",
  "What's your education background?",
];

export default function ChatSidebar({ isOpen, onClose }: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm an AI assistant here to help answer your questions about this portfolio. Feel free to ask about technical skills, projects, education, or work experience.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingTimeout, setThinkingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [thinkingInterval, setThinkingInterval] = useState<NodeJS.Timeout | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [currentMood, setCurrentMood] = useState<AIMood>("professional");
  
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

  console.log(`[Session] ID: ${sessionId}, Mood: ${currentMood}`);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    console.log(`[Mood Change] New mood: ${currentMood}`);
    // Do NOT clear the conversation on mood change.
    // Mood now applies to the next message only; keep history intact for context.
  }, [currentMood]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "💭 Thinking",
      },
    ]);
    
    // Animate thinking dots
    let dotCount = 0;
    const thinkingInterval = setInterval(() => {
      dotCount = (dotCount + 1) % 4;
      const dots = '.'.repeat(dotCount);
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant' && lastMessage.content.startsWith('💭 Thinking')) {
          lastMessage.content = `💭 Thinking${dots}`;
        }
        return newMessages;
      });
    }, 500);
    setInput("");
    setIsLoading(true);

    // Create abort controller for request termination
    const controller = new AbortController();
    setAbortController(controller);

    // Progressive timeout stages
    const stage1Timeout = setTimeout(() => {
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant' && lastMessage.content.startsWith('💭')) {
          lastMessage.content = '🕒 Hold on, processing your request...';
        }
        return newMessages;
      });
    }, 4000);

    const stage2Timeout = setTimeout(() => {
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant' && lastMessage.content.includes('processing')) {
          lastMessage.content = '⏳ Getting there, almost done...';
        }
        return newMessages;
      });
    }, 8000);

    const abortTimeout = setTimeout(() => {
      controller.abort();
      clearInterval(thinkingInterval);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "❌ Request timed out after 12 seconds. My AI model couldn't process this in time. Please try asking in a simpler way or refresh and try again.",
        },
      ]);
      setIsLoading(false);
      setAbortController(null);
    }, 12000);

    console.log(`[API Call] 🚀 Sending query: "${input.trim()}" with mood: ${currentMood}, sessionId: ${sessionId}`);

    const requestBody = {
      messages: [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      })),
      mood: currentMood,
      sessionId: sessionId,
    };
    
    console.log('[API Call] 📦 Request body:', JSON.stringify(requestBody, null, 2));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      // Clear all timeouts on successful response
      clearTimeout(stage1Timeout);
      clearTimeout(stage2Timeout);
      clearTimeout(abortTimeout);
      clearInterval(thinkingInterval);

      if (response.status === 400) {
        const errorData = await response.json();
        // Update the thinking message with error
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'assistant' && lastMessage.content === "💭 Thinking...") {
            lastMessage.content = errorData.message || "Please ask about my professional background, skills, or projects.";
          }
          return newMessages;
        });
        setIsLoading(false);
        return;
      }

      if (response.status === 500) {
        const errorData = await response.json();
        console.error('[API Error]', errorData);
        // Update the thinking message with error
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'assistant' && lastMessage.content === "💭 Thinking...") {
            lastMessage.content = `⚠️ Server error: ${errorData.message || 'Failed to generate response'}${errorData.details ? `\n\nDetails: ${errorData.details}` : ''}`;
          }
          return newMessages;
        });
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        console.error('[API Error] Status:', response.status, 'Status Text:', response.statusText);
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body reader is null');
      }
      
      const decoder = new TextDecoder();
      let aiResponse = "";

      // Update the existing "Thinking..." message instead of adding a new one
      let streamedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        streamedContent += chunk;
        
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = streamedContent;
          }
          return newMessages;
        });
      }

      console.log('[API Call] ✅ Full response:', streamedContent);
      
      setIsLoading(false);
      setAbortController(null);
    } catch (error) {
      console.error("[API Error]", error);
      
      // Clear all timeouts and intervals on error
      if (thinkingTimeout) {
        clearTimeout(thinkingTimeout);
        setThinkingTimeout(null);
      }
      if (thinkingInterval) {
        clearInterval(thinkingInterval);
        setThinkingInterval(null);
      }
      
      // Don't show error if request was aborted (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "⚠️ Sorry, I encountered an error. Please try again.",
        },
      ]);
      setIsLoading(false);
    }
  };

  const handleComment = (messageId: string, comment: string, rating: 'positive' | 'negative') => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, rating } : msg
      )
    );

    // Simple 1-sentence response
    const aiResponse = rating === 'positive' 
      ? "Thank you for the feedback!" 
      : "I'm sorry, I'll try to improve my responses.";
    
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "assistant",
        content: aiResponse,
      },
    ]);

    console.log('[Feedback] User rated response:', rating, '(NOT saved to DB)');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }, 100);
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[440px] bg-background border-l shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
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

            <MoodSelector currentMood={currentMood} onMoodChange={setCurrentMood} />

            {messages.length === 1 && (
              <SuggestedQuestions suggestions={SUGGESTIONS} onSelect={handleSuggestionClick} />
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} role={message.role} content={message.content} />
            ))}

            <div ref={messagesEndRef} />
          </div>

          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            mood={currentMood}
          />
        </div>
      </div>
    </>
  );
}
