"use client"

import { useState, useEffect, useCallback, type CSSProperties } from "react"
import { DigitalNino, type DigitalNinoMood } from "@/components/digital-nino"

interface IntroScreenProps {
  onStart: () => void
}

// Humble, factual one-liners. No bragging.
const DIALOGUES: { text: string; mood: DigitalNinoMood }[] = [
  { text: "Hi, I'm Digital Niño, Niño's AI companion.", mood: "normal" },
  { text: "He works on agentic AI, automation, and the web.", mood: "normal" },
  { text: "He tends to notice the small inconsistencies.", mood: "normal" },
  { text: "Right now he's building his capstone system.", mood: "normal" },
  { text: "He helps run JPCS at St. Paul University.", mood: "normal" },
  { text: "He builds with React, Next.js, Flutter, and AI agents.", mood: "happy" },
  { text: "He's done a bit of robotics, here and abroad.", mood: "normal" },
  { text: "Ask me anything about his work.", mood: "happy" },
]

const BOOT_STEPS = ["init system", "load profile", "mount rag pipeline", "ready"]

export default function IntroScreen({ onStart }: IntroScreenProps) {
  const [phase, setPhase] = useState<"idle" | "loading" | "ready">("idle")
  const [progress, setProgress] = useState(0)
  const [blink, setBlink] = useState(true)

  // Typewriter state
  const [dialogueIndex, setDialogueIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState("")
  const [isTalking, setIsTalking] = useState(false)
  const [currentMood, setCurrentMood] = useState<DigitalNinoMood>("normal")

  useEffect(() => {
    const t = setInterval(() => setBlink((v) => !v), 600)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const { text, mood } = DIALOGUES[dialogueIndex]
    setCurrentMood(mood)
    setDisplayedText("")
    setIsTalking(true)

    let i = 0
    let pauseTimer: ReturnType<typeof setTimeout> | undefined
    const typeInterval = setInterval(() => {
      i++
      setDisplayedText(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(typeInterval)
        setIsTalking(false)
        pauseTimer = setTimeout(() => {
          setDialogueIndex((prev) => (prev + 1) % DIALOGUES.length)
        }, 2200)
      }
    }, 42)

    return () => {
      clearInterval(typeInterval)
      if (pauseTimer) clearTimeout(pauseTimer)
    }
  }, [dialogueIndex])

  const handleStart = useCallback(() => {
    setPhase((p) => {
      if (p !== "idle") return p
      let n = 0
      const t = setInterval(() => {
        n += Math.random() * 16 + 6
        if (n >= 100) {
          n = 100
          clearInterval(t)
          setPhase("ready")
          setTimeout(onStart, 450)
        }
        setProgress(Math.min(n, 100))
      }, 110)
      return "loading"
    })
  }, [onStart])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") handleStart()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [handleStart])

  const stepIndex = Math.min(BOOT_STEPS.length - 1, Math.floor((progress / 100) * BOOT_STEPS.length))

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center overflow-hidden select-none">
      {/* Dot-matrix field */}
      <div
        className="absolute inset-0 dot-grid opacity-40 pointer-events-none"
        style={{ "--dot": "#2a2a2a" } as CSSProperties}
      />

      {/* Registration marks */}
      <span className="absolute top-5 left-5 nm-label-sm text-white/40">+ portfolio</span>
      <span className="absolute top-5 right-5 nm-label-sm text-white/40">v2.0 +</span>
      <span className="absolute bottom-5 left-5 nm-label-sm text-white/40">+ 14.6&deg;n 121.0&deg;e</span>
      <span className="absolute bottom-5 right-5 nm-label-sm text-white/40">&copy; 2026 +</span>

      {/* Digital Niño + speech bubble — clicking here does NOT trigger start */}
      <div className="relative flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        {/* Fixed-height bubble area so the layout below never shifts when text wraps */}
        <div className="h-16 flex items-end justify-center">
          <div className="bg-white/10 border border-white/15 rounded-sm px-5 py-2.5 max-w-xs text-center font-ntype text-[15px] leading-snug text-white/90 backdrop-blur-sm">
            {displayedText}
            {isTalking && (
              <span className="inline-block w-[2px] h-3.5 bg-white/70 ml-0.5 align-middle animate-pulse" />
            )}
          </div>
        </div>

        <DigitalNino
          size={92}
          mood={phase === "loading" ? "happy" : currentMood}
          isTalking={isTalking}
          theme="dark"
        />
      </div>

      {/* Name */}
      <h1 className="text-5xl md:text-7xl font-medium text-center px-4 mb-2">Niño Marcos</h1>
      <p className="nm-label text-white/60 mb-10">Project Management, AI Automation and Full Stack</p>

      {/* Click-to-start area — only this button triggers start */}
      {phase === "idle" && (
        <button
          onClick={handleStart}
          className={`nm-label text-white transition-opacity duration-150 cursor-pointer bg-transparent border-none ${blink ? "opacity-100" : "opacity-25"}`}
        >
          [ click or press enter to begin ]
        </button>
      )}

      {phase !== "idle" && (
        <div className="w-72 md:w-80">
          <div className="flex justify-between items-center nm-label-sm text-white/60 mb-2">
            <span>{phase === "ready" ? "ready" : BOOT_STEPS[stepIndex]}</span>
            <span className="nm-display text-white text-base">{Math.round(progress).toString().padStart(3, "0")}</span>
          </div>
          <div className="h-px bg-white/15 relative">
            <div
              className="absolute left-0 top-0 h-px bg-white transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
