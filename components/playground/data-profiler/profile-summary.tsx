"use client"

// components/playground/data-profiler/profile-summary.tsx
//
// The dataset-level headline figures: retained rows, total rows, columns and
// duplicate rows. Reuses `MetricGrid`, whose `MetricCard` already applies
// `tabular-nums`, so the four figures align without any local styling.
//
// Retained and total are shown as separate cards rather than one "1,000 of
// 50,000" string because they answer different questions — how much was
// profiled, and how much the file held — and Requirement 1.7's notice already
// explains the relationship in prose when they differ.
//
// _Requirements: 3.2_

import { MetricGrid } from "@/components/docs/common"
import type { DataProfile } from "@/lib/data-profiler/types"

interface ProfileSummaryProps {
  profile: DataProfile
  className?: string
}

function formatCount(value: number): string {
  return value.toLocaleString("en-US")
}

export function ProfileSummary({ profile, className = "" }: ProfileSummaryProps) {
  const truncated = profile.totalRowCount > profile.retainedRowCount

  return (
    <div className={`space-y-3 ${className}`}>
      <p className="nm-label-sm">
        {`Source: ${profile.sourceName}`}
      </p>

      <MetricGrid
        columns={4}
        metrics={[
          {
            label: "Rows profiled",
            value: formatCount(profile.retainedRowCount),
            description: "Data rows held in memory and analysed",
          },
          {
            label: "Rows in file",
            value: formatCount(profile.totalRowCount),
            description: truncated
              ? "Read from the file before the row cap applied"
              : "Every row in the file was profiled",
          },
          {
            label: "Columns",
            value: formatCount(profile.columns.length),
            description: "One profile per header field",
          },
          {
            label: "Duplicate rows",
            value: formatCount(profile.duplicateRowCount),
            description: "Rows identical to an earlier retained row",
          },
        ]}
      />
    </div>
  )
}
