"use client"

// components/data-analyst-sandbox/data-profiler/intake-panel.tsx
//
// CSV intake: the upload control, the sample picker, the read progress, and
// every message the intake path can produce.
//
// Presentational only. It receives the state machine's `status` plus the parse
// issue list and the row-cap notice, and it calls back up. It never reads a
// file itself — `selectFile` in `use-profiler.ts` owns that.
//
// Two deliberate structural choices:
//
//   1. The file control is a real `<input type="file">` kept in the accessible
//      tree with `sr-only`, fronted by a `<label>` styled with `buttonVariants`.
//      That keeps native keyboard activation (Enter and Space on the input)
//      and native form semantics, instead of a visible button that forwards
//      clicks to a hidden input via a ref. Because an `sr-only` input cannot
//      show its own focus ring, the ring is painted on the label through
//      `peer-focus-visible:*`, which is why the input precedes the label in the
//      DOM (Requirement 9.4).
//   2. Status text and error text sit inside live regions of their own. The
//      shared `AlertBox` carries no `role="alert"`, so announcement has to be
//      arranged here rather than assumed.
//
// _Requirements: 1.1, 1.2, 1.4, 1.5, 1.7, 1.8, 1.9, 1.11, 1.14, 1.15, 9.5_

import { useId, useState } from "react"
import { FileText, Info, TriangleAlert, Upload } from "lucide-react"

import { AlertBox } from "@/components/docs/common"
import { buttonVariants } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PROFILER_SAMPLES } from "@/data/profiler-samples"
import { ROW_CAP, SIZE_CAP_BYTES } from "@/lib/data-profiler/constants"
import type { ParseIssue } from "@/lib/data-profiler/types"
import type { ProfilerStatus } from "@/lib/data-profiler/use-profiler"

import { ParseProgress } from "./parse-progress"

/** How many recorded row indices Requirement 1.11 asks for. */
const ISSUE_INDEX_LIMIT = 10

const SIZE_CAP_MB = Math.round(SIZE_CAP_BYTES / (1024 * 1024))

interface IntakePanelProps {
  status: ProfilerStatus
  /** Rows whose field count differed from the header (Requirements 1.10, 1.11). */
  issues: ParseIssue[]
  /** Row-cap and recommendation-cap notice from the hook (Requirements 1.7, 5.12). */
  notice: string | null
  onSelectFile: (file: File) => void
  onSelectSample: (id: string) => void
  /**
   * `full` is the empty state: the sample picker first, upload second.
   *
   * Once a profile is loaded the panel splits in two. `alerts` renders only the
   * progress, error, row-cap and parse-issue messages, and stays at the TOP of
   * the canvas where a problem with the current file has to be seen. `compact`
   * renders only the controls, and sits at the FOOT of the canvas: loading a
   * different file is the last thing a visitor does, not the first, and putting
   * it under the charts means the charts are what they land on.
   */
  variant?: "full" | "compact" | "alerts"
  className?: string
}

function formatCount(value: number): string {
  return value.toLocaleString("en-US")
}

/** The one-line progress or working message for the current status. */
function describeWorking(status: ProfilerStatus): string | null {
  switch (status.kind) {
    case "parsing":
      return "Parsing rows in your browser."
    case "profiling":
      return status.column === ""
        ? "Computing the column profile."
        : `Computing the column profile. Processing column "${status.column}".`
    default:
      return null
  }
}

export function IntakePanel({
  status,
  issues,
  notice,
  onSelectFile,
  onSelectSample,
  variant = "full",
  className = "",
}: IntakePanelProps) {
  const compact = variant === "compact"
  const alertsOnly = variant === "alerts"
  const fileInputId = useId()
  const fileHelpId = useId()
  const sampleLabelId = useId()

  // The picker's own display value. Local because the control is presentational:
  // the hook models the load, not the selection, and re-selecting the same
  // sample is a legitimate action (it re-runs the pipeline).
  const [sampleId, setSampleId] = useState<string>("")

  const working = describeWorking(status)
  const isReading = status.kind === "reading"
  const errorMessage = status.kind === "error" ? status.message : null
  const shownIssueIndices = issues.slice(0, ISSUE_INDEX_LIMIT)

  return (
    <div className={`space-y-4 ${className}`}>
      {alertsOnly ? null : compact ? (
        /* Loaded state: one row, no cards, no help text. */
        /* No label: the section heading in `content.tsx` already names this. */
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-full max-w-[16rem]" id={sampleLabelId}>
          <Select
            // Controlled from the first render. Radix treats `""` as "nothing
            // selected" and shows the placeholder, so no empty-valued
            // `SelectItem` is needed; Radix forbids one.
            value={sampleId}
            onValueChange={(value) => {
              setSampleId(value)
              onSelectSample(value)
            }}
          >
            <SelectTrigger aria-labelledby={sampleLabelId} className="min-h-11 w-full">
              <SelectValue placeholder="Select a sample dataset" />
            </SelectTrigger>
            <SelectContent>
              {PROFILER_SAMPLES.map((sample) => (
                <SelectItem key={sample.id} value={sample.id} className="min-h-11">
                  {/* Requirement 1.1: name and data row count on every entry. */}
                  {`${sample.label}, ${formatCount(sample.rowCount)} rows`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
          <input
            id={fileInputId}
            type="file"
            accept=".csv"
            aria-describedby={compact ? undefined : fileHelpId}
            className="sr-only peer"
            onChange={(event) => {
              const file = event.target.files?.[0]
              // Clearing the value lets the same file be chosen twice in a row.
              event.target.value = ""
              if (file) onSelectFile(file)
            }}
          />
          <label
            htmlFor={fileInputId}
            className={`${buttonVariants({ variant: "outline" })} min-h-11 cursor-pointer peer-focus-visible:border-ring peer-focus-visible:ring-ring/50 peer-focus-visible:ring-[3px]`}
          >
            <Upload aria-hidden="true" />
            Upload a CSV
          </label>
        </div>
      ) : (
        /*
          Empty state. The sample picker comes FIRST and is the emphasized
          panel: almost nobody arrives at a demo holding a CSV, and the fastest
          way to show what this does is to hand them one. Upload sits second as
          the quieter option rather than as the default it used to look like.
        */
        <div className="space-y-3">
          <div className="nm-panel-strong rounded-md p-4 space-y-2">
            <p className="text-sm font-medium text-foreground" id={sampleLabelId}>
              Start with a sample dataset
            </p>
          <Select
            // Controlled from the first render. Radix treats `""` as "nothing
            // selected" and shows the placeholder, so no empty-valued
            // `SelectItem` is needed; Radix forbids one.
            value={sampleId}
            onValueChange={(value) => {
              setSampleId(value)
              onSelectSample(value)
            }}
          >
            <SelectTrigger aria-labelledby={sampleLabelId} className="min-h-11 w-full">
              <SelectValue placeholder="Select a sample dataset" />
            </SelectTrigger>
            <SelectContent>
              {PROFILER_SAMPLES.map((sample) => (
                <SelectItem key={sample.id} value={sample.id} className="min-h-11">
                  {/* Requirement 1.1: name and data row count on every entry. */}
                  {`${sample.label}, ${formatCount(sample.rowCount)} rows`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {PROFILER_SAMPLES.find((sample) => sample.id === sampleId)?.description ??
                `${PROFILER_SAMPLES.length} curated files, bundled with the site. Pick one and the profile appears immediately.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <input
            id={fileInputId}
            type="file"
            accept=".csv"
            aria-describedby={compact ? undefined : fileHelpId}
            className="sr-only peer"
            onChange={(event) => {
              const file = event.target.files?.[0]
              // Clearing the value lets the same file be chosen twice in a row.
              event.target.value = ""
              if (file) onSelectFile(file)
            }}
          />
            <label
              htmlFor={fileInputId}
              className={`${buttonVariants({ variant: "outline" })} min-h-11 cursor-pointer peer-focus-visible:border-ring peer-focus-visible:ring-ring/50 peer-focus-visible:ring-[3px]`}
            >
              <Upload aria-hidden="true" />
              Or upload your own CSV
            </label>
            <p id={fileHelpId} className="text-xs leading-relaxed text-muted-foreground">
              {`Up to ${SIZE_CAP_MB} MB, first ${formatCount(ROW_CAP)} rows. Parsed in your browser; no row leaves this page.`}
            </p>
          </div>
        </div>
      )}

      {/* --- Progress and working status ----------------------------------
          Suppressed in the controls-only variant: these same messages render
          from the `alerts` instance at the top of the canvas, and showing them
          twice on one page was the bug this split was meant to avoid. */}
      {!compact && (isReading || working !== null) && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-md border border-border bg-card p-4"
        >
          {isReading ? (
            <ParseProgress percent={status.percent} />
          ) : (
            <p className="text-sm text-muted-foreground">{working}</p>
          )}
        </div>
      )}

      {/* --- Failures ----------------------------------------------------- */}
      {!compact && errorMessage !== null && (
        <div role="alert">
          <AlertBox type="error" icon={TriangleAlert} title="That dataset was not loaded">
            {errorMessage}
          </AlertBox>
        </div>
      )}

      {/* --- Row-cap / truncation notice ----------------------------------- */}
      {!compact && notice !== null && (
        <AlertBox type="info" icon={Info} title="What was included">
          {notice}
        </AlertBox>
      )}

      {/* --- Parse issues (Requirement 1.11) ------------------------------ */}
      {!compact && issues.length > 0 && (
        <AlertBox
          type="warning"
          icon={FileText}
          title={`${formatCount(issues.length)} ${issues.length === 1 ? "row" : "rows"} had an unexpected field count`}
        >
          <p>
            {`These rows were kept and profiled. Showing the first ${Math.min(
              issues.length,
              ISSUE_INDEX_LIMIT,
            )} recorded row ${shownIssueIndices.length === 1 ? "index" : "indices"}:`}
          </p>
          <ul className="mt-2 space-y-1">
            {shownIssueIndices.map((issue) => (
              <li key={issue.rowIndex} className="tabular-nums">
                {`Row ${formatCount(issue.rowIndex)}: ${formatCount(issue.actualFieldCount)} fields, header has ${formatCount(issue.expectedFieldCount)}`}
              </li>
            ))}
          </ul>
        </AlertBox>
      )}
    </div>
  )
}
