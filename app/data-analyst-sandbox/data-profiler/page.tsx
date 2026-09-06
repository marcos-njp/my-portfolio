// app/data-analyst-sandbox/data-profiler/page.tsx
//
// Server component. Owns the route metadata and the loading boundary; every
// interactive part lives in `content.tsx`, which is the only client module on
// this route.
//
// The skeleton traces the three-zone workspace rather than the docs page it
// used to copy: a toolbar row, then a wide canvas beside a narrower rail. A
// skeleton whose shape does not match what replaces it produces a visible jump
// on hydration, which is the one thing a skeleton exists to avoid.
//
// _Requirements: 9.1, 9.2_

import type { Metadata } from "next";
import { Suspense } from "react";

import DataProfilerContent from "./content";

export const metadata: Metadata = {
  title: "CSV Data Profiler | Data Analyst Sandbox",
  description:
    "Profile a CSV in your browser: column types, statistics, correlations, recommended charts and a data quality score. Rows never leave the page. Only aggregates are sent, and only for the optional AI narrative.",
};

export default function DataProfilerPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-10 animate-pulse rounded bg-muted" />
          <div className="flex flex-col gap-4 xl:flex-row xl:gap-6">
            <div className="h-96 min-w-0 flex-1 animate-pulse rounded bg-muted" />
            <div className="hidden h-96 w-[21rem] flex-shrink-0 animate-pulse rounded bg-muted xl:block 2xl:w-[23rem]" />
          </div>
        </div>
      }
    >
      <DataProfilerContent />
    </Suspense>
  );
}
