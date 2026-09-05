"use client";

// app/playground/layout.tsx
//
// Chrome for the `/playground/*` routes. Deliberately the same header as
// `app/docs/layout.tsx` — fixed `h-14` bar, `bg-background/85 backdrop-blur`,
// the `m-njp.` wordmark, the `ThemeToggle` on the right, `max-w-7xl` gutters and
// a `pt-20` content offset — so moving between the two sections does not look
// like moving between two sites.
//
// Three deliberate differences:
//
//   1. No `DocsSidebar`. The playground is a small set of standalone demos, not
//      a tree of documents, so there is no navigation to persist.
//   2. No `MobileNav`. That component imports `docsNav`/`isDocActive` from
//      `components/docs/nav-items` and hardcodes the documentation section list;
//      rendering it here would put docs links in a playground drawer. The
//      breadcrumb link back to `/` is the whole mobile navigation instead.
//   3. `<main>` is `max-w-5xl`, not the docs' `max-w-3xl`. The profiler puts a
//      column-profile table beside a two-up chart grid, and 3xl forces the table
//      into a horizontal scroller on a laptop.
//
// Tokens only: no literal color, spacing or font value appears below
// (Requirement 9.2).
//
// _Requirements: 9.2_

import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link href="/" className="font-mono text-base font-medium tracking-tight">
                m-njp<span className="text-primary">.</span>
              </Link>
              <span className="hidden sm:inline nm-label-sm">/</span>
              <Link
                href="/playground/data-profiler"
                className="hidden sm:inline nm-label hover:text-foreground transition-colors motion-reduce:transition-none"
              >
                Playground
              </Link>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <main className="w-full min-w-0 max-w-5xl py-6 md:py-8 scroll-mt-24">
          {children}
        </main>
      </div>
    </div>
  );
}
