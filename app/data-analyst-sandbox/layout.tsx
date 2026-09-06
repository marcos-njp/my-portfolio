"use client";

// app/data-analyst-sandbox/layout.tsx
//
// Chrome for the `/data-analyst-sandbox/*` routes. The same header as
// `app/docs/layout.tsx` - fixed `h-14` bar, `bg-background/85 backdrop-blur`,
// the `m-njp.` wordmark, the `ThemeToggle` on the right, wide gutters and
// a `pt-20` content offset - so moving between the two sections does not look
// like moving between two sites.
//
// It now also shares the docs' sidebar shell. The earlier version had none, on
// the reasoning that the sandbox was a single standalone demo with no tree to
// navigate; splitting the profiler's explanation onto its own route gave it a
// second destination, and the sidebar is how you reach it. The list comes from
// `components/data-analyst-sandbox/nav-items.ts`; the sidebar itself is the same
// `SectionSidebar` the docs render, so the two sections cannot drift apart.
//
// `<main>` carries no max-width, and the shell is capped at 1800px rather than
// the docs' 1280px. The docs cap at `max-w-3xl` inside that because prose has an
// ideal measure; a chart does not. Three zones at 1280px left the canvas around
// 600px wide, which is two cramped charts per row, so the shell takes the width
// and the nav column gives some back.
//
// Both `Suspense` boundaries are required, not stylistic: `SectionSidebar` and
// `MobileSectionNav` call `useSearchParams()`, which without a boundary opts the
// whole route out of static rendering and fails the build.
//
// Tokens only: no literal color, spacing or font value appears below
// (Requirement 9.2).
//
// _Requirements: 9.2_

import { Suspense } from "react";
import Link from "next/link";

import { MobileSectionNav } from "@/components/nav/MobileSectionNav";
import { SectionSidebar } from "@/components/nav/SectionSidebar";
import { sandboxNav } from "@/components/data-analyst-sandbox/nav-items";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function DataAnalystSandboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Suspense fallback={<div className="md:hidden w-9 h-9" />}>
                <MobileSectionNav label="Data Analyst Sandbox" items={sandboxNav} />
              </Suspense>
              <div className="flex items-center gap-3">
                <Link href="/" className="font-mono text-base font-medium tracking-tight">
                  m-njp<span className="text-primary">.</span>
                </Link>
                <span className="hidden sm:inline nm-label-sm">/</span>
                <Link
                  href="/data-analyst-sandbox/data-profiler"
                  className="hidden sm:inline nm-label hover:text-foreground transition-colors motion-reduce:transition-none"
                >
                  Data Analyst Sandbox
                </Link>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1800px] px-4 pt-20 sm:px-6 lg:px-8">
        <div className="flex gap-5 lg:gap-6">
          <Suspense fallback={<div className="hidden md:block w-48 flex-shrink-0" />}>
            <aside className="sticky top-20 hidden h-[calc(100vh-80px)] w-48 flex-shrink-0 overflow-y-auto border-r border-border pr-2 md:block">
              <SectionSidebar label="Data Analyst Sandbox" items={sandboxNav} />
            </aside>
          </Suspense>

          <main className="w-full min-w-0 flex-1 scroll-mt-24 py-5 md:py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
