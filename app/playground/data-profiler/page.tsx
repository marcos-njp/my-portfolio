// app/playground/data-profiler/page.tsx
//
// Server component. Owns the route metadata and the loading boundary; every
// interactive part lives in `content.tsx`, which is the only client module on
// this route.
//
// The skeleton mirrors `app/docs/page.tsx` exactly (`h-8` + `h-64`
// `bg-muted animate-pulse`) so the wait looks like the rest of the site
// (Requirement 9.1).
//
// _Requirements: 9.1, 9.2_

import type { Metadata } from "next";
import { Suspense } from "react";

import DataProfilerContent from "./content";

export const metadata: Metadata = {
  title: "CSV Data Profiler | Playground",
  description:
    "Profile a CSV in your browser: column types, statistics, correlations, recommended charts and a data quality score. Rows never leave the page — only aggregates are sent for the optional AI narrative.",
};

export default function DataProfilerPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
      }
    >
      <DataProfilerContent />
    </Suspense>
  );
}
