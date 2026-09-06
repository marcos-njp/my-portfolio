'use client';

// components/data-analyst-sandbox/data-profiler/insight-panel.tsx
//
// The insight control and the rendered Insight_Narrative.
//
// --- Why there is no text input anywhere in this file ------------------------
//
// Requirement 6.4: the insight control exposes ZERO free-text input fields, and
// the Insight_Payload carries zero fields originating from visitor keyboard or
// clipboard input. That is the whole security posture of the feature — the
// payload is built from the Data_Profile by `insight-payload.ts` and validated
// against a depth-uniform `.strict()` schema at the boundary, so there is no
// channel through which prompt text could reach the model. Adding an input here
// (a "tone" box, a "focus area" hint, anything) would reintroduce prompt
// injection as a threat and invalidate that guarantee. Do not add one.
//
// Everything the model produced is rendered as escaped JSX text children. No
// `dangerouslySetInnerHTML`, ever — the narrative is untrusted output.
//
// Failure and timeout messages render beside the narrative area and change
// nothing else, so the profile, the charts and the Quality_Score stay on screen
// (Requirements 6.11, 6.13).
//
// _Requirements: 6.4, 6.11, 6.12, 6.13, 6.14, 6.15_

import { ArrowRight, Minus, Sparkles } from 'lucide-react';
import { AlertBox, HighlightBox } from '@/components/docs/common';
import { Button } from '@/components/ui/button';
import type { InsightNarrative } from '@/lib/data-profiler/insight-schema';

/** Requirement 6.15, shown adjacent to both the control and any narrative. */
const PRIVACY_STATEMENT =
  'The narrative is generated from aggregated statistics only: column types, counts, summary statistics, correlations and the quality score. Your raw rows stay in this browser and are never sent anywhere.';

export interface InsightPanelProps {
  narrative: InsightNarrative | null;
  /** Requirements 7.7/9.7 sibling: false before a profile exists. */
  canRequest: boolean;
  /** Requirement 6.12: true while a request is in flight. */
  pending: boolean;
  /** Requirement 6.11/6.13 message, supplied verbatim by the parent. */
  errorMessage?: string | null;
  onRequest: () => void;
  className?: string;
}

export function InsightPanel({
  narrative,
  canRequest,
  pending,
  errorMessage = null,
  onRequest,
  className = '',
}: InsightPanelProps) {
  // Requirement 6.12: a native `disabled` button rejects both pointer and
  // keyboard activation, so repeat activations while pending cannot reach the
  // handler at all. The hook guards the same case; this is the visible half.
  const disabled = !canRequest || pending;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={onRequest}
          disabled={disabled}
          aria-busy={pending}
          // Requirement 9.5: 44x44 minimum target at the base breakpoint.
          className="min-h-11 min-w-11"
        >
          <Sparkles aria-hidden="true" />
          {pending ? 'Generating insights...' : 'Generate AI insights'}
        </Button>
        {!canRequest ? (
          <p className="text-xs text-muted-foreground">
            Profile a dataset first. Insights are derived from a completed profile.
          </p>
        ) : null}
      </div>

      {/*
        Requirement 6.15 wants this statement adjacent to the control AND to any
        rendered narrative. Sitting between the two satisfies both at once, and
        keeps a single source of the sentence rather than two copies that could
        drift.
      */}
      <HighlightBox type="note" title="Derived data only">
        {PRIVACY_STATEMENT}
      </HighlightBox>

      {errorMessage ? (
        <AlertBox type="error" title="Insights unavailable">
          {errorMessage}
        </AlertBox>
      ) : null}

      {narrative ? (
        <div className="space-y-4">
          <section className="space-y-2">
            <h3 className="text-sm font-medium tracking-tight">Summary</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{narrative.summary}</p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-medium tracking-tight">Observations</h3>
            <ul className="space-y-1.5">
              {narrative.observations.map((observation, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Minus className="mt-1 size-3 shrink-0 text-foreground" aria-hidden="true" />
                  <span className="leading-relaxed">{observation}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-medium tracking-tight">Suggested next analyses</h3>
            <ul className="space-y-1.5">
              {narrative.nextAnalyses.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="mt-1 size-3 shrink-0 text-foreground" aria-hidden="true" />
                  <span className="leading-relaxed">{suggestion}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  );
}
