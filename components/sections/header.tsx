"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"

const NAV = [
  { href: "#about", label: "Profile" },
  { href: "#ai-chat", label: "Ask AI" },
  { href: "#approach", label: "Workflow" },
  { href: "#experience", label: "Experience" },
  { href: "#contact", label: "Contact" },
]

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Spec-sheet status strip */}
      <div className="border-b border-border bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-7 flex items-center justify-between nm-label-sm">
          <span>portfolio // v2.0</span>
          <span className="hidden sm:inline">Tuguegarao City Cagayan</span>
          <span className="inline-flex items-center gap-1.5">sys.online <span className="nm-led nm-led-blink" /></span>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="font-mono text-base font-medium tracking-tight">
              m-njp<span className="text-primary">.</span>
            </Link>

            <nav className="hidden md:flex items-center gap-7">
              {NAV.map((l) => (
                <Link key={l.href} href={l.href} className="nm-label hover:text-foreground transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link href="/docs" className="hidden sm:inline-flex nm-link nm-link-accent">
                Docs
              </Link>
              <ThemeToggle />
              <button
                type="button"
                aria-label="Menu"
                onClick={() => setOpen((v) => !v)}
                className="md:hidden inline-flex items-center justify-center w-9 h-9 border border-border rounded-md hover:border-foreground transition-colors"
              >
                {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-border bg-background">
            <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col">
              {NAV.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="nm-label py-3 hover:text-foreground transition-colors border-b border-border"
                >
                  {l.label}
                </Link>
              ))}
              <Link href="/docs" onClick={() => setOpen(false)} className="nm-label py-3 text-primary">
                Docs →
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  )
}
