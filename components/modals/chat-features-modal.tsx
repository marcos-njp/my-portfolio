"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ChevronDown } from "lucide-react"

const FLOW_STEPS = [
  {
    step: "01",
    label: "You ask a question",
    summary: "The chat is scoped to portfolio questions: my work, projects, skills, and background.",
    detail:
      "Every message is treated as something that should be answered from my own material. This is not a general assistant. It is a direct window into what I have built and done.",
  },
  {
    step: "02",
    label: "The system retrieves context",
    summary: "Before writing anything, it searches a knowledge base built from my notes and docs.",
    detail:
      "Upstash Vector indexes the portfolio knowledge base. A semantic similarity search pulls the most relevant chunks before any answer is composed, so the reply starts from the right projects, background details, and documentation.",
  },
  {
    step: "03",
    label: "Groq writes the response",
    summary: "The model receives retrieved context first, then composes a grounded reply.",
    detail:
      "Using gpt-oss-120b via Groq, the response draws from actual source material rather than general training data. It sounds natural because it is working from real portfolio content.",
  },
  {
    step: "04",
    label: "Scope is enforced",
    summary: "The response stays close to what is actually in the portfolio.",
    detail:
      "If a question falls outside portfolio scope, the system declines cleanly rather than guessing. No fabricated credentials, no invented project details.",
  },
]

const STACK = ["Groq gpt-oss-120b", "Upstash Vector", "Upstash Redis"]

export function ChatFeaturesModal() {
  const [activeStep, setActiveStep] = useState<number | null>(null)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="nm-link nm-hover">How it works</button>
      </DialogTrigger>

      <DialogContent className="max-w-[500px] max-h-[90vh] overflow-y-auto p-0 gap-0 [&>button]:top-4 [&>button]:right-4 [&>button]:z-20 [&>button]:rounded-sm [&>button]:border [&>button]:border-border [&>button]:bg-background [&>button]:p-1 [&>button]:opacity-100">
        <DialogHeader>
          <div className="border-b border-border px-6 py-5 pr-14">
            <div className="flex items-center gap-3">
              <span className="nm-display text-muted-foreground text-sm leading-none">01</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <DialogTitle className="mt-3 text-xl font-medium">
              How the chat works
            </DialogTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              A RAG pipeline scoped entirely to my portfolio.
            </p>
          </div>
        </DialogHeader>

        <div className="px-6 py-5">
          <div className="relative">
            <div className="absolute left-5 top-8 bottom-8 w-px bg-border" />

            <div className="space-y-0">
              {FLOW_STEPS.map((item, index) => {
                const isActive = activeStep === index

                return (
                  <div key={item.step}>
                    <button
                      type="button"
                      onClick={() => setActiveStep(isActive ? null : index)}
                      className="group relative flex w-full items-start gap-4 py-3 text-left"
                    >
                      <div
                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center border transition-all duration-200 ${
                          isActive
                            ? "border-foreground bg-secondary"
                            : "border-border bg-background group-hover:border-line-strong"
                        }`}
                      >
                        <span
                          className={`nm-display text-xs leading-none transition-colors duration-200 ${
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        >
                          {item.step}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 pt-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <h3
                            className={`text-sm font-medium transition-colors duration-200 ${
                              isActive
                                ? "text-foreground"
                                : "text-foreground/80 group-hover:text-foreground"
                            }`}
                          >
                            {item.label}
                          </h3>
                          <ChevronDown
                            className={`h-3.5 w-3.5 shrink-0 transition-all duration-200 ${
                              isActive
                                ? "rotate-180 text-foreground"
                                : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground pr-2">
                          {item.summary}
                        </p>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          key="detail"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="ml-14 pb-4 pt-1">
                            <div className="border border-border rounded-sm px-4 py-3">
                              <p className="text-sm leading-relaxed text-foreground/80">
                                {item.detail}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="nm-label-sm">powered by</span>
              {STACK.map((tech) => (
                <span
                  key={tech}
                  className="nm-label-sm border border-border px-2.5 py-1"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
