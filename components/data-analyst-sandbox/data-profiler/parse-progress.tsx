"use client"

// components/data-analyst-sandbox/data-profiler/parse-progress.tsx
//
// The read-progress indicator for Requirement 1.8: a whole-number percentage
// from 0 to 100 alongside a determinate bar.
//
// The percentage numeral is one of the three places on this page where Ndot
// (`.nm-display`) is permitted — it is a loading numeral, exactly the case the
// font guide carves out. The label beside it is NType82 via `.nm-label-sm`, and
// nothing else here uses the display face.

import { ProgressBar } from "@/components/ui/progress-bar"

interface ParseProgressProps {
  /** Percentage of bytes read. Clamped and rounded to a whole number here. */
  percent: number
  /** What is being read. Also used to build the bar's accessible name. */
  label?: string
  className?: string
}

/** Clamps to 0..100 and rounds, so the numeral and the bar never disagree. */
function toWholePercent(percent: number): number {
  if (!Number.isFinite(percent)) return 0
  return Math.min(Math.max(Math.round(percent), 0), 100)
}

export function ParseProgress({
  percent,
  label = "Reading file",
  className = "",
}: ParseProgressProps) {
  const whole = toWholePercent(percent)

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="nm-label-sm">{label}</p>
        {/* Approved Ndot use: a loading percentage numeral. */}
        <p className="nm-display text-2xl leading-none tabular-nums text-foreground">
          {whole}%
        </p>
      </div>
      <ProgressBar
        value={whole}
        max={100}
        label={`${label}: ${whole} percent complete`}
        className="h-3"
      />
    </div>
  )
}
