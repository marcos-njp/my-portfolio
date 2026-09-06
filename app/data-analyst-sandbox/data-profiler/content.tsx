"use client";

// app/data-analyst-sandbox/data-profiler/content.tsx
//
// The composed CSV Data Profiler workspace. This file wires the state machine in
// `lib/data-profiler/use-profiler.ts` to the presentational panels in
// `components/data-analyst-sandbox/data-profiler/`. It holds no analysis logic, no
// formatting and no derived statistics; every panel arrives ready to render.
//
// --- Why this is no longer a document ----------------------------------------
//
// It used to be a `DocPageLayout` wrapping nine `DocSection`s, each with a
// heading and a sentence of subtitle, stacked in one column capped at
// `max-w-5xl`. That is the right shape for the docs hub and the wrong shape
// here: roughly 900 words of standing chrome sat above the first chart, and a
// wide screen showed a narrow ribbon with empty gutters.
//
// It is now three zones. The section nav is the layout's, the canvas holds the
// charts and the column tables, and the inspector rail holds the readings about
// them. `WorkspaceShell` owns the geometry; this file owns what goes in it.
//
// The page title moved into an `sr-only` `<h1>`. A visible one would restate
// what the sidebar's active item and the toolbar's file name already say, but
// removing it entirely would leave the document unnamed, so it stays for
// assistive technology and for the document outline.
//
// The explanation that used to be section nine now lives at
// `/data-analyst-sandbox/data-profiler/how-it-works`, reachable from the sidebar
// and from the toolbar link.
//
// --- Where the one error message goes ----------------------------------------
//
// The hook keeps a single `status: { kind: 'error', message }` for every
// non-destructive failure: a rejected file, a failed sample fetch, a failed
// profile, a failed insight request, a failed question and a failed export all
// land in the same slot. Four surfaces can render an error (`IntakePanel` reads
// it off `status` itself; `InsightPanel` and `AskPanel` take it as a prop, and
// the export failure renders above the toolbar), so handing the message to all
// four would print the same sentence four times.
//
// The fix is one piece of view-only state: `errorOwner`, the panel whose
// operation was most recently activated. Every control's handler stamps it
// before delegating to the hook, so when a message appears the owner is already
// correct: an error can only be produced by the operation that was just started.
// The message is routed to exactly that panel and the others are shown none. For
// the intake path that means passing `status` through unchanged; for the others
// it means passing a status with the `error` arm masked back to what the machine
// is actually displaying, which is why `intakeStatus` exists.
//
// Two alternatives were rejected. Adding a `source` field to the hook's `error`
// action would put presentation routing inside the state machine, which owns no
// layout concerns and is unit-tested against the current shape. Rendering the
// message once at page level, outside all the panels, would move it away from
// the control that failed.
//
// --- Reduced motion ----------------------------------------------------------
//
// `globals.css` carries no `prefers-reduced-motion` block, so the preference is
// read here, once, with `useReducedMotion()` and threaded into `ChartGrid`
// (which passes it to every Recharts series and tooltip as
// `isAnimationActive={false}`). CSS transitions this file introduces are
// neutralised with Tailwind's `motion-reduce:` variant rather than a second JS
// read (Requirement 9.6).
//
// _Requirements: 8.1, 8.2, 8.8, 9.1, 9.2, 9.5, 9.6, 9.7_

import { useCallback, useState } from "react";
import { useReducedMotion } from "framer-motion";

import { AskDialog } from "@/components/data-analyst-sandbox/data-profiler/ask-dialog";
import { AskCard } from "@/components/data-analyst-sandbox/data-profiler/ask-card";
import {
  CanvasTabs,
  type CanvasView,
} from "@/components/data-analyst-sandbox/data-profiler/canvas-tabs";
import { ChartGrid } from "@/components/data-analyst-sandbox/data-profiler/chart-grid";
import { ColumnProfileTable } from "@/components/data-analyst-sandbox/data-profiler/column-profile-table";
import { ExportControls } from "@/components/data-analyst-sandbox/data-profiler/export-controls";
import { InspectorRail } from "@/components/data-analyst-sandbox/data-profiler/inspector-rail";
import { IntakePanel } from "@/components/data-analyst-sandbox/data-profiler/intake-panel";
import {
  RAIL_MEDIA_QUERY,
  WorkspaceShell,
} from "@/components/data-analyst-sandbox/data-profiler/workspace-shell";
import { WorkspaceToolbar } from "@/components/data-analyst-sandbox/data-profiler/workspace-toolbar";
import type { ReportFormat } from "@/lib/data-profiler/report-exporter";
import { useProfiler, type ProfilerStatus } from "@/lib/data-profiler/use-profiler";
import { useMediaQuery } from "@/lib/data-analyst-sandbox/use-media-query";
import { useRailState } from "@/lib/data-analyst-sandbox/use-rail-state";

/** Which surface is entitled to display the hook's single error message. */
type ErrorOwner = "intake" | "insight" | "ask" | "export";

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
    factIndex,
    canReset,
    canRequestNarrative,
    canExport,
    canAsk,
    selectFile,
    selectSample,
    requestNarrative,
    askQuestion,
    clearAnswer,
    exportReport,
    reset,
    reportChartError,
  } = useProfiler();

  // `useReducedMotion` returns `boolean | null` (null before the media query is
  // resolved); read once here and coerced, never read again further down.
  const reducedMotion = useReducedMotion() === true;

  const wide = useMediaQuery(RAIL_MEDIA_QUERY);
  const [railOpen, toggleRail] = useRailState("data-analyst-sandbox:profiler:rail", true);

  const [errorOwner, setErrorOwner] = useState<ErrorOwner>("intake");
  const [view, setView] = useState<CanvasView>("charts");
  const [askOpen, setAskOpen] = useState(false);

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

  const handleAsk = useCallback(
    (question: string) => {
      setErrorOwner("ask");
      askQuestion(question);
    },
    [askQuestion],
  );

  const handleOpenAsk = useCallback(() => {
    // Any previous answer is dropped on open, so the dialog never greets the
    // visitor with a reply to a question they asked ten minutes ago.
    clearAnswer();
    setErrorOwner("ask");
    setAskOpen(true);
  }, [clearAnswer]);

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

  const {
    status,
    profile,
    charts,
    chartErrors,
    issues,
    notice,
    narrative,
    askedQuestion,
    answer,
    retrieval,
  } = state;

  const errorMessage = status.kind === "error" ? status.message : null;

  const intakeStatus =
    errorOwner === "intake" ? status : maskError(status, profile !== null);
  const insightError = errorOwner === "insight" ? errorMessage : null;
  const askError = errorOwner === "ask" ? errorMessage : null;
  const exportError = errorOwner === "export" ? errorMessage : null;

  const toolbar = (
    <WorkspaceToolbar
      sourceName={profile?.sourceName ?? null}
      canReset={canReset}
      showRailToggle={wide && profile !== null}
      railOpen={railOpen}
      onToggleRail={toggleRail}
      onReset={handleReset}
    />
  );

  // --- Canvas ---------------------------------------------------------------
  //
  // With nothing loaded the intake panel IS the canvas: centered, on the dot
  // grid, with no heading above it. The dropzone label and the sample picker
  // already say what to do, so a "Load a dataset" heading and a sentence of
  // subtitle would only repeat them.
  //
  // Gated on the profile rather than rendered as an empty shell: an empty table
  // and a zeroed metric grid read as a broken page, and Requirement 8.3 asks for
  // zero Column_Profile records on screen with nothing loaded.
  const canvas =
    profile === null ? (
      <div className="dot-grid-fine flex min-h-[24rem] items-center justify-center rounded-md border border-border p-6">
        <div className="w-full max-w-xl">
          <IntakePanel
            status={intakeStatus}
            issues={issues}
            notice={notice}
            onSelectFile={handleSelectFile}
            onSelectSample={handleSelectSample}
          />
        </div>
      </div>
    ) : (
      <>
        {/* Messages only. A parse issue or the row-cap notice concerns the file
            that is on screen right now, so it stays at the top; the controls for
            loading a DIFFERENT file are at the foot of the canvas. */}
        <IntakePanel
          status={intakeStatus}
          issues={issues}
          notice={notice}
          onSelectFile={handleSelectFile}
          onSelectSample={handleSelectSample}
          variant="alerts"
        />

        <CanvasTabs
          view={view}
          onChange={setView}
          chartCount={charts.length}
          columnCount={profile.columns.length}
        />

        {/* Both panels stay mounted and one is hidden, so switching tabs does
            not remount a dozen Recharts trees or reset the tables' scroll. */}
        <div
          role="tabpanel"
          id="canvas-panel-charts"
          aria-labelledby="canvas-tab-charts"
          hidden={view !== "charts"}
        >
          <ChartGrid
            charts={charts}
            columns={profile.columns}
            reducedMotion={reducedMotion}
            chartErrors={chartErrors}
            onChartError={reportChartError}
            dense={wide && railOpen}
          />
        </div>

        <div
          role="tabpanel"
          id="canvas-panel-columns"
          aria-labelledby="canvas-tab-columns"
          hidden={view !== "columns"}
        >
          <ColumnProfileTable columns={profile.columns} />
        </div>

        {/* Ask Nino card, consistent with the home page trigger card */}
        <AskCard onOpen={handleOpenAsk} enabled={canAsk} />

        {/* --- Foot of the canvas ---------------------------------------
            Export first, then loading a different file. Both are things you do
            AFTER reading the profile, so they sit under it: the charts are what
            the visitor lands on, and reaching these means having scrolled past
            the work, which is the order the two actions actually happen in. */}
        <div className="space-y-5 border-t border-border pt-5">
          <ExportControls
            canExport={canExport}
            onExport={handleExport}
            errorMessage={exportError}
          />

          <div className="space-y-2">
            <p className="nm-label">Load another dataset</p>
            <IntakePanel
              status={intakeStatus}
              issues={issues}
              notice={notice}
              onSelectFile={handleSelectFile}
              onSelectSample={handleSelectSample}
              variant="compact"
            />
          </div>
        </div>
      </>
    );

  const inspector =
    profile === null ? null : (
      <InspectorRail
        profile={profile}
        hideTruncationNotice={notice !== null}
        onOpenAsk={handleOpenAsk}
      />
    );

  return (
    <>
      <h1 className="sr-only">CSV Data Profiler</h1>

      <WorkspaceShell
        toolbar={toolbar}
        canvas={canvas}
        inspector={inspector}
        railOpen={railOpen}
        wide={wide}
      />



      <AskDialog
        open={askOpen}
        onOpenChange={setAskOpen}
        sourceName={profile?.sourceName ?? "this dataset"}
        factCount={factIndex?.facts.length ?? 0}
        question={askedQuestion}
        answer={answer}
        retrieval={retrieval}
        canAsk={canAsk}
        pending={status.kind === "answering"}
        errorMessage={askError}
        onAsk={handleAsk}
        narrative={narrative}
        canRequestNarrative={canRequestNarrative}
        narrativePending={status.kind === "insightPending"}
        narrativeError={insightError}
        onRequestNarrative={handleRequestNarrative}
      />
    </>
  );
}
