"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Suspense } from "react";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { MobileNav } from "@/components/docs/MobileNav";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Suspense fallback={<div className="md:hidden w-9 h-9" />}>
                <MobileNav />
              </Suspense>
              <div className="flex items-center gap-6">
                <Link className="flex items-center" href="/">
                  <span className="font-semibold text-base">m-njp</span>
                </Link>
                <span className="hidden sm:inline text-xs text-muted-foreground">/</span>
                <Link href="/docs" className="hidden sm:inline text-xs font-medium text-muted-foreground hover:text-foreground">
                  Documentation
                </Link>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex gap-6 lg:gap-8">
          {/* Sidebar */}
          <Suspense fallback={<div className="hidden md:block w-64 flex-shrink-0" />}>
            <DocsSidebar />
          </Suspense>

          {/* Main Content */}
          <main className="flex-1 min-w-0 w-full">
            <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-20">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
