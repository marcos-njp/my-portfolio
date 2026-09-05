"use client"

// components/playground/data-profiler/intake-panel.tsx
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
        : `Computing the column profile. Processing column “${status.column}”.`
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
  className = "",
}: IntakePanelProps) {
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
      <div className="grid gap-4 sm:grid-cols-2">
        {/* --- Upload ------------------------------------------------------ */}
        <div className="rounded-md border border-border bg-card p-4 space-y-2">
          <p className="nm-label">Upload a CSV</p>

          {/*
            Input first, label second: `peer-*` variants only reach later
            siblings, and the label is what renders the focus ring.
          */}
          <input
            id={fileInputId}
            type="file"
            accept=".csv"
            aria-describedby={fileHelpId}
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
            className={`${buttonVariants({ variant: "outline" })} min-h-11 min-w-11 w-full cursor-pointer peer-focus-visible:border-ring peer-focus-visible:ring-ring/50 peer-focus-visible:ring-[3px]`}
          >
            <Upload aria-hidden="true" />
            Choose a CSV file
          </label>

          <p id={fileHelpId} className="text-xs text-muted-foreground leading-relaxed">
            {`Files with the .csv extension, up to ${SIZE_CAP_MB} MB. The first ${formatCount(ROW_CAP)} data rows are profiled. Parsing runs in your browser and no row ever leaves this page.`}
          </p>
        </div>

        {/* --- Sample picker ---------------------------------------------- */}
        <div className="rounded-md border border-border bg-card p-4 space-y-2">
          <p className="nm-label" id={sampleLabelId}>
            Or pick a sample dataset
          </p>

          <Select
            // Controlled from the first render. Radix treats `""` as "nothing
            // selected" and shows the placeholder, so no empty-valued
            // `SelectItem` is needed — Radix forbids one.
            value={sampleId}
            onValueChange={(value) => {
              setSampleId(value)
              onSelectSample(value)
            }}
          >
            {/* No empty-valued item exists, so the placeholder carries the empty state. */}
            <SelectTrigger
              aria-labelledby={sampleLabelId}
              className="min-h-11 w-full"
            >
              <SelectValue placeholder="Select a sample dataset" />
            </SelectTrigger>
            <SelectContent>
              {PROFILER_SAMPLES.map((sample) => (
                <SelectItem key={sample.id} value={sample.id} className="min-h-11">
                  {/* Requirement 1.1: name and data row count on every entry. */}
                  {`${sample.label} — ${formatCount(sample.rowCount)} rows`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {PROFILER_SAMPLES.find((sample) => sample.id === sampleId)?.description ??
              `${PROFILER_SAMPLES.length} curated files, bundled with the site.`}
          </p>
        </div>
      </div>

      {/* --- Progress and working status ---------------------------------- */}
      {(isReading || working !== null) && (
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
      {errorMessage !== null && (
        <div role="alert">
          <AlertBox type="error" icon={TriangleAlert} title="That dataset was not loaded">
            {errorMessage}
          </AlertBox>
        </div>
      )}

      {/* --- Row-cap / truncation notice ----------------------------------- */}
      {notice !== null && (
        <AlertBox type="info" icon={Info} title="What was included">
          {notice}
        </AlertBox>
      )}

      {/* --- Parse issues (Requirement 1.11) ------------------------------ */}
      {issues.length > 0 && (
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
                {`Row ${formatCount(issue.rowIndex)} — ${formatCount(issue.actualFieldCount)} fields, header has ${formatCount(issue.expectedFieldCount)}`}
              </li>
            ))}
          </ul>
        </AlertBox>
      )}
    </div>
  )
}
