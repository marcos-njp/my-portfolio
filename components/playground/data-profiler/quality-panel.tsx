"use client"

// components/playground/data-profiler/quality-panel.tsx
//
// The Quality_Score, its four penalty contributions, and the cleaning
// recommendations.
//
// **Why not `TroubleshootCard`.** design.md proposed it for recommendations, but
// it takes five required props — `problem`, `description`, `diagnosis`,
// `solution`, `prevention` — and a `CleaningRecommendation` supplies four
// fields, none of which is a "prevention". Filling that slot would mean
// inventing advice the scorer never produced, so a compact `HighlightBox` per
// recommendation is used instead: it maps onto the real fields without padding.
//
// **Ordering.** `quality-scorer.ts` emits recommendations already ordered by
// descending penalty of the producing factor (Requirement 5.7). This component
// renders `recommendations` as given and sorts nothing.
//
// _Requirements: 5.7, 5.10, 5.11, 5.12_

import {
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Copy,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"

import { HighlightBox, MetricGrid } from "@/components/docs/common"
import { ProgressBar } from "@/components/ui/progress-bar"
import { MAX_RENDERED_RECOMMENDATIONS } from "@/lib/data-profiler/constants"
import type {
  CleaningIssue,
  QualityFactor,
  QualityResult,
} from "@/lib/data-profiler/types"

interface QualityPanelProps {
  /** `null` before profiling completes — Requirement 5.10. */
  quality: QualityResult | null
  /**
   * Set when the hook's `notice` already states the undisplayed recommendation
   * count, so Requirement 5.12's statement is not printed twice on the page.
   */
  hideTruncationNotice?: boolean
  className?: string
}

const FACTOR_LABELS: Record<QualityFactor, string> = {
  nulls: "Missing values",
  duplicates: "Duplicate rows",
  outliers: "Outliers",
  unknownTypes: "Untyped columns",
}

const ISSUE_LABELS: Record<CleaningIssue, string> = {
  nulls: "Missing values",
  duplicates: "Duplicate rows",
  outliers: "Outliers",
  unknownType: "Type could not be determined",
}

/**
 * `AlertBox`/`HighlightBox` render `warning` and `error` identically, so the
 * icon is the only per-issue signal available. Each issue therefore gets a
 * distinct one, and the title states the issue in words as well.
 */
const ISSUE_ICONS: Record<CleaningIssue, LucideIcon> = {
  nulls: CircleAlert,
  duplicates: Copy,
  outliers: TrendingUp,
  unknownType: CircleHelp,
}

function formatCount(value: number): string {
  return value.toLocaleString("en-US")
}

export function QualityPanel({
  quality,
  hideTruncationNotice = false,
  className = "",
}: QualityPanelProps) {
  // Requirement 5.10: no profile means no score, stated plainly.
  if (quality === null) {
    return (
      <p className={`text-sm text-muted-foreground ${className}`}>
        Profiling must complete before scoring. Load a CSV file or a sample
        dataset to see the quality score.
      </p>
    )
  }

  const { score, penalties, recommendations } = quality
  const shown = recommendations.slice(0, MAX_RENDERED_RECOMMENDATIONS)
  const undisplayed = recommendations.length - shown.length

  return (
    <div className={`space-y-5 ${className}`}>
      {/* --- Score -------------------------------------------------------- */}
      <div className="rounded-md border border-border bg-card p-5 space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <p className="nm-label">Quality score</p>
          <p className="flex items-baseline gap-1">
            {/* Approved Ndot use: the Quality_Score numeral. */}
            <span className="nm-display text-4xl leading-none tabular-nums text-foreground">
              {score}
            </span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </p>
        </div>
        <ProgressBar
          value={score}
          max={100}
          label={`Data quality score: ${score} out of 100`}
          className="h-3"
        />
        <p className="text-xs text-muted-foreground">
          100 minus the four penalty contributions below. Every penalty is
          derived from the profile, never from a sample of rows.
        </p>
      </div>

      {/* --- Penalty contributions ---------------------------------------- */}
      <MetricGrid
        columns={4}
        metrics={penalties.map((penalty) => ({
          label: FACTOR_LABELS[penalty.factor],
          value: `-${penalty.penalty}`,
          description: `${penalty.weight} point maximum · ${(penalty.ratio * 100).toFixed(1)}% affected`,
        }))}
      />

      {/* --- Recommendations ---------------------------------------------- */}
      <section className="space-y-3">
        <h3 className="text-base font-medium tracking-tight">
          Cleaning recommendations
        </h3>

        {recommendations.length === 0 ? (
          // Requirement 5.11.
          <HighlightBox
            type="success"
            icon={CircleCheck}
            title="No cleaning actions required"
          >
            No missing values, no duplicate rows, no outliers and no untyped
            columns were found, so there is nothing to clean before analysis.
          </HighlightBox>
        ) : (
          <>
            <ul className="space-y-2">
              {shown.map((recommendation, index) => (
                <li key={`${recommendation.issue}-${recommendation.column ?? "dataset"}-${index}`}>
                  <HighlightBox
                    type="warning"
                    icon={ISSUE_ICONS[recommendation.issue]}
                    title={`${recommendation.column ?? "Whole dataset"} — ${ISSUE_LABELS[recommendation.issue]}`}
                  >
                    <p>{recommendation.detail}</p>
                    <p className="mt-1 text-foreground">{recommendation.action}</p>
                  </HighlightBox>
                </li>
              ))}
            </ul>

            {/* Requirement 5.12, unless the page-level notice already says it. */}
            {undisplayed > 0 && !hideTruncationNotice && (
              <p className="text-xs text-muted-foreground">
                {`Showing the first ${formatCount(MAX_RENDERED_RECOMMENDATIONS)} of ${formatCount(recommendations.length)} recommendations. ${formatCount(undisplayed)} are not displayed.`}
              </p>
            )}
          </>
        )}
      </section>
    </div>
  )
}
