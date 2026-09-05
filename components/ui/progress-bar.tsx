import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Clamps `value` into the inclusive range 0..max and returns both the clamped
 * value (for `aria-valuenow`) and its percentage of `max` (for the fill width).
 * Defensive against NaN, Infinity and a non-positive `max`.
 */
function resolveProgress(value: number, max: number) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100
  const safeValue = Number.isFinite(value) ? value : 0
  const clamped = Math.min(Math.max(safeValue, 0), safeMax)

  return { max: safeMax, value: clamped, percent: (clamped / safeMax) * 100 }
}

function ProgressBar({
  className,
  value,
  max = 100,
  label,
  ...props
}: React.ComponentProps<"div"> & {
  /** Current progress. Clamped into 0..max. */
  value: number
  /** Upper bound of the scale. Defaults to 100. */
  max?: number
  /**
   * Describes what is progressing, exposed as `aria-label`. Pass
   * `aria-label` or `aria-labelledby` directly to override.
   */
  label?: string
}) {
  const progress = resolveProgress(value, max)

  return (
    <div
      data-slot="progress-bar"
      role="progressbar"
      aria-label={label}
      aria-valuenow={progress.value}
      aria-valuemin={0}
      aria-valuemax={progress.max}
      className={cn(
        "bg-secondary relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      {/*
        The fill width is an arbitrary runtime percentage, which Tailwind cannot
        express as a static utility, so it is the one inline style here. It
        carries geometry only — never color. Color stays on tokens (`bg-primary`
        fill over a `bg-secondary` track). The width transition is disabled
        under `prefers-reduced-motion` via `motion-reduce:transition-none`
        (Requirement 9.6).
      */}
      <div
        data-slot="progress-bar-fill"
        className="bg-primary h-full transition-[width] duration-300 ease-out motion-reduce:transition-none"
        style={{ width: `${progress.percent}%` }}
      />
    </div>
  )
}

export { ProgressBar }
