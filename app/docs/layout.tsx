"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Suspense } from "react";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { MobileNav } from "@/components/docs";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Suspense fallback={<div className="md:hidden w-9 h-9" />}>
                <MobileNav />
              </Suspense>
              <div className="flex items-center gap-3">
                <Link href="/" className="font-mono text-base font-medium tracking-tight">
                  m-njp<span className="text-primary">.</span>
                </Link>
                <span className="hidden sm:inline nm-label-sm">/</span>
                <Link href="/docs" className="hidden sm:inline nm-label hover:text-foreground transition-colors">
                  documentation
                </Link>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="flex gap-6 lg:gap-8">
          {/* Sidebar */}
          <Suspense fallback={<div className="hidden md:block w-64 flex-shrink-0" />}>
            <aside className="hidden md:block w-64 flex-shrink-0 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto border-r border-border pr-2">
              <DocsSidebar />
            </aside>
          </Suspense>

          {/* Main Content */}
          <main className="flex-1 min-w-0 w-full max-w-3xl py-6 md:py-8 scroll-mt-24">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
