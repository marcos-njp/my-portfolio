"use client";

// app/playground/data-profiler/content.tsx
//
// The composed CSV Data Profiler page. This file wires the state machine in
// `lib/data-profiler/use-profiler.ts` to the presentational panels in
// `components/playground/data-profiler/`. It holds no analysis logic, no
// formatting and no derived statistics — every panel arrives ready to render.
//
// --- Where the one error message goes ----------------------------------------
//
// The hook keeps a single `status: { kind: 'error', message }` for every
// non-destructive failure: a rejected file, a failed sample fetch, a failed
// profile, a failed insight request and a failed export all land in the same
// slot. Three panels can render an error (`IntakePanel` reads it off `status`
// itself; `InsightPanel` and `ExportControls` take an `errorMessage` prop), so
// handing the message to all three would print the same sentence three times.
//
// The fix is one piece of view-only state: `errorOwner`, the panel whose
// operation was most recently activated. Every control's handler stamps it
// before delegating to the hook, so when a message appears the owner is already
// correct — an error can only be produced by the operation that was just
// started. The message is then routed to exactly that panel and the other two
// are shown no error at all. For the intake path that means passing `status`
// through unchanged; for the other two it means passing a status with the
// `error` arm masked back to what the machine is actually displaying
// (`profiled` when a profile is on screen, `idle` when not), which is why
// `intakeStatus` exists.
//
// Two alternatives were rejected. Adding a `source` field to the hook's `error`
// action would put presentation routing inside the state machine, which owns no
// layout concerns and is unit-tested against the current shape. Rendering the
// message once at page level, outside all three panels, would move it away from
// the control that failed — Requirement 7.8 wants the export failure beside the
// export controls, and 6.11 wants the insight failure beside the narrative area.
//
// --- Reduced motion ----------------------------------------------------------
//
// `globals.css` carries no `prefers-reduced-motion` block, so the preference is
// read here, once, with `useReducedMotion()` and threaded into `ChartGrid` (which
// passes it to every Recharts series as `isAnimationActive={false}`). CSS
// transitions this file introduces are neutralised with Tailwind's
// `motion-reduce:` variant rather than a second JS read (Requirement 9.6).
//
// _Requirements: 8.1, 8.2, 8.8, 9.1, 9.2, 9.5, 9.6, 9.7_

import { useCallback, useState } from "react";
import { RotateCcw } from "lucide-react";
import { useReducedMotion } from "framer-motion";

import { DocPageLayout, DocSection } from "@/components/docs/common";
import { ChartGrid } from "@/components/playground/data-profiler/chart-grid";
import { ColumnProfileTable } from "@/components/playground/data-profiler/column-profile-table";
import { CorrelationList } from "@/components/playground/data-profiler/correlation-list";
import { ExportControls } from "@/components/playground/data-profiler/export-controls";
import { InsightPanel } from "@/components/playground/data-profiler/insight-panel";
import { IntakePanel } from "@/components/playground/data-profiler/intake-panel";
import { ProfileSummary } from "@/components/playground/data-profiler/profile-summary";
import { ProfilerExplainer } from "@/components/playground/data-profiler/profiler-explainer";
import { QualityPanel } from "@/components/playground/data-profiler/quality-panel";
import { Button } from "@/components/ui/button";
import type { ReportFormat } from "@/lib/data-profiler/report-exporter";
import { useProfiler, type ProfilerStatus } from "@/lib/data-profiler/use-profiler";

/** Which panel is entitled to display the hook's single error message. */
type ErrorOwner = "intake" | "insight" | "export";

/**
 * The status as the intake panel should see it. When the last failure belonged
 * to another panel, the `error` arm is replaced with the state the machine is
 * really in, so intake shows no alert while the other panel shows the message.
 */
function maskError(status: ProfilerStatus, hasProfile: boolean): ProfilerStatus {
  if (status.kind !== "error") return status;
  return hasProfile ? { kind: "profiled" } : { kind: "idle" };
}

export default function DataProfilerContent() {
  const {
    state,
    canReset,
    canRequestNarrative,
    canExport,
    selectFile,
    selectSample,
    requestNarrative,
    exportReport,
    reset,
    reportChartError,
  } = useProfiler();

  // `useReducedMotion` returns `boolean | null` (null before the media query is
  // resolved); read once here and coerced, never read again further down.
  const reducedMotion = useReducedMotion() === true;

  const [errorOwner, setErrorOwner] = useState<ErrorOwner>("intake");

  const handleSelectFile = useCallback(
    (file: File) => {
      setErrorOwner("intake");
      selectFile(file);
    },
    [selectFile],
  );

  const handleSelectSample = useCallback(
    (id: string) => {
      setErrorOwner("intake");
      selectSample(id);
    },
    [selectSample],
  );

  const handleRequestNarrative = useCallback(() => {
    setErrorOwner("insight");
    requestNarrative();
  }, [requestNarrative]);

  const handleExport = useCallback(
    (format: ReportFormat) => {
      setErrorOwner("export");
      exportReport(format);
    },
    [exportReport],
  );

  const handleReset = useCallback(() => {
    // Requirement 8.8: back to the Requirement 9.7 state, message included.
    setErrorOwner("intake");
    reset();
  }, [reset]);

  const { status, profile, charts, chartErrors, issues, notice, narrative } = state;
  const errorMessage = status.kind === "error" ? status.message : null;

  const intakeStatus =
    errorOwner === "intake" ? status : maskError(status, profile !== null);
  const insightError = errorOwner === "insight" ? errorMessage : null;
  const exportError = errorOwner === "export" ? errorMessage : null;

  return (
    <DocPageLayout
      eyebrow="playground"
      index="01"
      title="CSV Data Profiler"
      subtitle="Drop in a CSV and get column types, per-column statistics, correlations, recommended charts and a data quality score. Everything is computed in this browser tab; only aggregated statistics are ever sent anywhere, and only if you ask for the AI narrative."
    >
      {/* --- Intake ------------------------------------------------------- */}
      <DocSection
        title="Load a dataset"
        subtitle="Upload your own CSV or start from a bundled sample."
      >
        <IntakePanel
          status={intakeStatus}
          issues={issues}
          notice={notice}
          onSelectFile={handleSelectFile}
          onSelectSample={handleSelectSample}
        />

        {/*
          Requirements 8.1 and 8.2: a real `<button>`, so Tab reaches it and both
          Enter and Space activate it, and `disabled` whenever there is nothing
          to discard — which also removes it from the tab order rather than
          offering a control that does nothing.
        */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={!canReset}
            className="min-h-11 min-w-11 motion-reduce:transition-none"
          >
            <RotateCcw aria-hidden="true" />
            Reset
          </Button>
          <p className="text-xs text-muted-foreground">
            {profile === null
              ? "Nothing is loaded yet."
              : `Loaded: ${profile.sourceName}. Reset discards the dataset, the profile, the charts, the score and the narrative.`}
          </p>
        </div>
      </DocSection>

      {/* --- Profile ------------------------------------------------------ */}
      {/*
        Gated on the profile rather than rendered as an empty shell: an empty
        table and a zeroed metric grid read as a broken page, and Requirement 8.3
        asks for zero Column_Profile records on screen with nothing loaded.
      */}
      {profile !== null && (
        <>
          <DocSection
            title="Dataset summary"
            subtitle="What was read, what was retained, and how much of it repeats."
          >
            <ProfileSummary profile={profile} />
          </DocSection>

          <DocSection
            title="Column profiles"
            subtitle="One row per header field, in file order, with the inferred type and its statistics."
          >
            <ColumnProfileTable columns={profile.columns} />
          </DocSection>

          <DocSection
            title="Correlations"
            subtitle="Pearson coefficients between numeric column pairs, strongest first."
          >
            <CorrelationList correlations={profile.correlations} />
          </DocSection>

          <DocSection
            title="Recommended charts"
            subtitle="Chosen from the profile, not configured by you. Each chart carries a text alternative."
          >
            <ChartGrid
              charts={charts}
              columns={profile.columns}
              reducedMotion={reducedMotion}
              chartErrors={chartErrors}
              onChartError={reportChartError}
            />
          </DocSection>

          <DocSection
            title="Data quality"
            subtitle="A 0–100 score, the four penalties behind it, and what to fix first."
          >
            {/*
              The hook's `notice` already states how many recommendations were
              not displayed, and it renders above in the intake panel, so the
              panel's own copy of that sentence is suppressed (Requirement 5.12).
            */}
            <QualityPanel quality={profile.quality} hideTruncationNotice={notice !== null} />
          </DocSection>
        </>
      )}

      {/* --- Insights ------------------------------------------------------ */}
      {/*
        Always rendered. Requirement 9.7 wants the control visible and disabled
        with an explanation before anything is profiled, and both panels below
        already render that explanation from `canRequest` / `canExport` — it is
        not repeated here.
      */}
      <DocSection
        title="AI insight narrative"
        subtitle="An optional written interpretation, generated from the aggregates only."
      >
        <InsightPanel
          narrative={narrative}
          canRequest={canRequestNarrative}
          pending={status.kind === "insightPending"}
          errorMessage={insightError}
          onRequest={handleRequestNarrative}
        />
      </DocSection>

      {/* --- Export -------------------------------------------------------- */}
      <DocSection
        title="Export the report"
        subtitle="Markdown or JSON, built and saved in this tab with no upload."
      >
        <ExportControls
          canExport={canExport}
          onExport={handleExport}
          errorMessage={exportError}
        />
      </DocSection>

      {/* --- Explainer ----------------------------------------------------- */}
      {/* Requirement 9.3/9.7: visible and complete with nothing loaded. */}
      <DocSection
        title="How it works"
        subtitle="The thresholds, the outlier rule, the score weights, and what leaves the page."
      >
        <ProfilerExplainer />
      </DocSection>
    </DocPageLayout>
  );
}
