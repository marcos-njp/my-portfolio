"use client"

// components/sections/announcement-banner.tsx
//
// A dismissible strip announcing the two features shipped through a Kiro spec:
// the enhanced RAG digital twin and the Data Analyst Sandbox. Sits above
// `SideNav`'s content and above the mobile top bar, so it is the first thing a
// visitor reads on either layout.
//
// Dismissal persists across reloads via `usePersistedFlag` (the same
// `localStorage`-through-`useSyncExternalStore` pattern the rail toggle and the
// media query hook use), so closing it once does not mean closing it on every
// visit... it means not seeing it again until the flag is cleared.

import Link from "next/link"
import { X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { usePersistedFlag } from "@/lib/use-persisted-flag"

const DISMISS_KEY = "announcement:kiro-spec-v2:dismissed"

export function AnnouncementBanner() {
  const [dismissed, setDismissed] = usePersistedFlag(DISMISS_KEY, false)

  if (dismissed) return null

  return (
    <div className="relative border-b-2 border-primary bg-card text-foreground shadow-xs">
      <div className="dot-grid-fine absolute inset-0 opacity-30 pointer-events-none" />
      <div className="relative mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="nm-led nm-led-blink shrink-0" />
          <Badge
            className="shrink-0 font-sans font-bold text-xs tracking-wide bg-primary text-primary-foreground px-2.5 py-1 rounded-sm border-0 shadow-xs"
          >
            Built with Kiro
          </Badge>

          <p className="min-w-0 flex-1 text-xs sm:text-sm text-foreground/90 leading-snug">
            New release: explore the{" "}
            <Link
              href="/#ai-chat"
              onClick={(e) => {
                const el = document.getElementById("ai-chat")
                if (el) {
                  e.preventDefault()
                  el.scrollIntoView({ behavior: "smooth" })
                  history.pushState(null, "", "/#ai-chat")
                }
              }}
              className="font-semibold text-foreground underline underline-offset-4 decoration-primary hover:text-primary transition-colors"
            >
              enhanced RAG
            </Link>{" "}
            digital twin and the{" "}
            <Link
              href="/data-analyst-sandbox/data-profiler"
              className="font-semibold text-foreground underline underline-offset-4 decoration-primary hover:text-primary transition-colors"
            >
              Data Analyst Sandbox
            </Link>
            .
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss announcement"
          className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
