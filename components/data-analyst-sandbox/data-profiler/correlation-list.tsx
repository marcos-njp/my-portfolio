"use client"

// components/data-analyst-sandbox/data-profiler/correlation-list.tsx
//
// Pearson correlation pairs, rendered in the order the profile supplies them.
// `profiler.ts` already sorts by descending absolute coefficient with a
// deterministic name tiebreak (Requirement 3.7), so this component sorts
// nothing — re-sorting here would risk silently disagreeing with the exported
// report, which serializes the same list.
//
// The strength word beside each coefficient is a reading aid, not a statistic:
// it is derived from |r| alone and says nothing about significance.
//
// _Requirements: 3.7, 3.11, 3.15_

import type { CorrelationPair } from "@/lib/data-profiler/types"

interface CorrelationListProps {
  correlations: CorrelationPair[]
  /** `rail` is the compact form: a stacked list rather than a four-column table. */
  variant?: "full" | "rail"
  className?: string
}

/** Plain-language band for |r|. Bands are conventional, not inferential. */
function describeStrength(coefficient: number): string {
  const magnitude = Math.abs(coefficient)
  const direction = coefficient < 0 ? "negative" : "positive"
  if (magnitude >= 0.9) return `very strong ${direction}`
  if (magnitude >= 0.7) return `strong ${direction}`
  if (magnitude >= 0.5) return `moderate ${direction}`
  if (magnitude >= 0.3) return `weak ${direction}`
  return "negligible"
}

function formatCoefficient(coefficient: number): string {
  if (!Number.isFinite(coefficient)) return "n/a"
  return coefficient.toLocaleString("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
    signDisplay: "exceptZero",
  })
}

const CELL = "px-3 py-2 align-top"
const HEAD_CELL = "px-3 py-2 text-left nm-label-sm whitespace-nowrap"

export function CorrelationList({
  correlations,
  variant = "full",
  className = "",
}: CorrelationListProps) {
  if (correlations.length === 0) {
    return (
      <p className={`text-sm text-muted-foreground ${className}`}>
        No correlations were computed. That needs at least two numeric columns
        with a non-zero standard deviation and at least 3 rows where both values
        are present and numeric.
      </p>
    )
  }

  // The rail is 22rem wide. A four-column table with two header names in it
  // becomes a horizontal scroller at that width, which is worse than a list, so
  // the same rows are stacked instead. The pair, the coefficient and the
  // strength band are all still present; only the grid is gone.
  if (variant === "rail") {
    return (
      <ul className={`divide-y divide-border overflow-hidden rounded-md border border-border bg-card ${className}`}>
        {correlations.map((pair) => (
          <li key={`${pair.columnA}__${pair.columnB}`} className="px-3 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <p className="min-w-0 truncate text-sm text-foreground">
                {`${pair.columnA} vs ${pair.columnB}`}
              </p>
              <p className="shrink-0 font-mono text-sm tabular-nums text-foreground">
                {formatCoefficient(pair.coefficient)}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {describeStrength(pair.coefficient)}
            </p>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Two names plus a coefficient stay readable at 375px, but the wrapper
          keeps any long header name from widening the page (Requirement 9.5). */}
      <div
        tabIndex={0}
        className="overflow-x-auto rounded-md border border-border bg-card focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <table className="w-full min-w-[30rem] border-collapse text-sm">
          <caption className="sr-only">
            Pearson correlation coefficients for numeric column pairs, ordered by
            descending absolute coefficient.
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className={HEAD_CELL}>
                Column
              </th>
              <th scope="col" className={HEAD_CELL}>
                Paired with
              </th>
              <th scope="col" className="px-3 py-2 text-right nm-label-sm whitespace-nowrap">
                r
              </th>
              <th scope="col" className={HEAD_CELL}>
                Strength
              </th>
            </tr>
          </thead>
          <tbody>
            {correlations.map((pair) => (
              <tr
                key={`${pair.columnA}__${pair.columnB}`}
                className="border-b border-border last:border-0"
              >
                <th scope="row" className={`${CELL} text-left font-medium break-words`}>
                  {pair.columnA}
                </th>
                <td className={`${CELL} break-words`}>{pair.columnB}</td>
                <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                  {formatCoefficient(pair.coefficient)}
                </td>
                <td className={`${CELL} text-muted-foreground`}>
                  {describeStrength(pair.coefficient)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Correlation is not causation, and a coefficient near zero rules out a
        linear relationship only.
      </p>
    </div>
  )
}
