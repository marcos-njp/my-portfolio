"use client"

// components/data-analyst-sandbox/data-profiler/profile-summary.tsx
//
// The dataset-level headline figures: retained rows, total rows, columns and
// duplicate rows.
//
// Two variants. `full` is the original `MetricGrid` with a gloss under each
// figure. `rail` drops every gloss and renders a 2x2 grid of label and value,
// because a labelled number in a four-cell grid does not need a sentence
// explaining that "Columns" counts columns; the descriptions were four lines of
// standing text buying nothing, and the inspector rail is where space is
// tightest.
//
// Retained and total stay separate figures rather than one "1,000 of 50,000"
// string because they answer different questions, how much was profiled and how
// much the file held, and the row-cap notice already relates them in prose when
// they differ.
//
// _Requirements: 3.2_

import { MetricGrid } from "@/components/docs/common"
import type { DataProfile } from "@/lib/data-profiler/types"

interface ProfileSummaryProps {
  profile: DataProfile
  /** `rail` is the compact form for the inspector. */
  variant?: "full" | "rail"
  className?: string
}

function formatCount(value: number): string {
  return value.toLocaleString("en-US")
}

export function ProfileSummary({
  profile,
  variant = "full",
  className = "",
}: ProfileSummaryProps) {
  const truncated = profile.totalRowCount > profile.retainedRowCount

  const figures = [
    { label: "Rows profiled", value: formatCount(profile.retainedRowCount) },
    { label: "Rows in file", value: formatCount(profile.totalRowCount) },
    { label: "Columns", value: formatCount(profile.columns.length) },
    { label: "Duplicate rows", value: formatCount(profile.duplicateRowCount) },
  ]

  if (variant === "rail") {
    return (
      <section className={`space-y-2 ${className}`} aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="nm-label">
          summary
        </h2>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border">
          {figures.map((figure) => (
            <div key={figure.label} className="bg-card px-3 py-2">
              <dt className="nm-label-sm">{figure.label}</dt>
              <dd className="mt-0.5 text-lg tabular-nums text-foreground">{figure.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <p className="nm-label-sm">{`Source: ${profile.sourceName}`}</p>

      <MetricGrid
        columns={4}
        metrics={[
          {
            label: "Rows profiled",
            value: figures[0].value,
            description: "Data rows held in memory and analysed",
          },
          {
            label: "Rows in file",
            value: figures[1].value,
            description: truncated
              ? "Read from the file before the row cap applied"
              : "Every row in the file was profiled",
          },
          {
            label: "Columns",
            value: figures[2].value,
            description: "One profile per header field",
          },
          {
            label: "Duplicate rows",
            value: figures[3].value,
            description: "Rows identical to an earlier retained row",
          },
        ]}
      />
    </div>
  )
}
