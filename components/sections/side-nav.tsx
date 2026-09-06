"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowUpRight, Menu, X } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { PhilippineTime } from "@/components/data/philippine-time"

export const NAV_ITEMS = [
  { id: "about", index: "00", label: "Profile" },
  { id: "ai-chat", index: "01", label: "Ask AI" },
  { id: "approach", index: "02", label: "Workflow" },
  { id: "experience", index: "03", label: "Experience" },
  { id: "education", index: "04", label: "Education" },
  { id: "contact", index: "05", label: "Contact" },
]

/** Highlights the nav entry whose section currently occupies the viewport middle. */
function useActiveSection(): string {
  const [active, setActive] = useState(NAV_ITEMS[0].id)

  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(
      (el): el is HTMLElement => el !== null
    )
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] }
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return active
}

function Wordmark() {
  return (
    <Link href="/" className="font-mono text-base font-medium tracking-tight">
      m-njp<span className="text-primary">.</span>
    </Link>
  )
}

function NavList({ active, onNavigate }: { active: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col">
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.id
        return (
          <Link
            key={item.id}
            href={`#${item.id}`}
            onClick={onNavigate}
            aria-current={isActive ? "true" : undefined}
            className={`group flex items-center gap-3 px-3 py-2.5 border transition-colors ${
              isActive
                ? "border-border bg-secondary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <span
              className={`nm-display text-sm w-6 leading-none transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              }`}
            >
              {item.index}
            </span>
            <span className="nm-label text-current">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function NavFooter({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="border-t border-border px-3 pt-4 space-y-4">
      <Link
        href="/docs"
        onClick={onNavigate}
        className="flex items-center justify-between px-3 py-2.5 border border-border hover:border-foreground transition-colors"
      >
        <span className="nm-label text-foreground">Documentation</span>
        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
      </Link>

      <Link
        href="/data-analyst-sandbox/data-profiler"
        onClick={onNavigate}
        className="flex items-center justify-between px-3 py-2.5 border border-border hover:border-foreground transition-colors"
      >
        <span className="nm-label text-foreground">Data Analyst Sandbox</span>
        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
      </Link>

      <div className="px-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="nm-label-sm">Tuguegarao City</span>
          <PhilippineTime />
        </div>
        <div className="flex items-center justify-between">
          <span className="nm-label-sm inline-flex items-center gap-2">
            <span className="nm-led nm-led-blink" /> sys.online
          </span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}

export default function SideNav() {
  const active = useActiveSection()
  const [open, setOpen] = useState(false)

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col border-r border-border bg-background">
        <div className="px-6 py-6 border-b border-border">
          <Wordmark />
          <p className="nm-label-sm mt-2">Portfolio v2.0</p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="nm-label-sm px-3 mb-2">Sections</p>
          <NavList active={active} />
        </div>

        <div className="pb-5">
          <NavFooter />
        </div>
      </aside>

      {/* Mobile bar */}
      <div className="lg:hidden sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="flex items-center justify-between h-14 px-4 sm:px-6">
          <Wordmark />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
              className="inline-flex items-center justify-center w-9 h-9 border border-border rounded-sm hover:border-foreground transition-colors"
            >
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-[17rem] flex flex-col border-r border-border bg-background"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <Wordmark />
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center w-9 h-9 border border-border rounded-sm hover:border-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-5">
                <p className="nm-label-sm px-3 mb-2">Sections</p>
                <NavList active={active} onNavigate={() => setOpen(false)} />
              </div>

              <div className="pb-5">
                <NavFooter onNavigate={() => setOpen(false)} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
