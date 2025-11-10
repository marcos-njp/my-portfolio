"use client"

import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"

interface ChatTriggerProps {
  onClick: () => void
}

export default function ChatTrigger({ onClick }: ChatTriggerProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-30 group"
    >
      <MessageCircle className="h-6 w-6 transition-transform group-hover:scale-110" />
      <span className="sr-only">Open AI Chat</span>
      
      {/* Pulse animation */}
      <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
    </Button>
  )
}
