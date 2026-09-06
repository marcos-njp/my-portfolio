'use client';

// components/data-analyst-sandbox/data-profiler/canvas-tabs.tsx
//
// The segmented control that swaps the canvas between the chart grid and the
// column tables.
//
// This is what replaced two section headings and their subtitles. `Charts (12)`
// says everything `## Recommended charts` plus "Chosen from the profile, not
// configured by you" said, in a control the visitor can act on, and the count
// is a fact the heading never carried.
//
// A real ARIA tablist, unlike `components/docs/common/Tabs`: `role="tablist"`,
// `aria-selected`, roving `tabindex` and arrow-key navigation. That component is
// reused elsewhere in this feature as-is and its known gap is documented in
// `profiler-explainer.tsx`; here the control is the primary way to reach half
// the page, so it is worth the extra twenty lines rather than inheriting the
// gap. Fixing the shared component belongs in the shared component.

import { useRef } from 'react';

export type CanvasView = 'charts' | 'columns';

export interface CanvasTabsProps {
  view: CanvasView;
  onChange: (view: CanvasView) => void;
  chartCount: number;
  columnCount: number;
}

const TABS: ReadonlyArray<{ id: CanvasView; label: string }> = [
  { id: 'charts', label: 'Charts' },
  { id: 'columns', label: 'Columns' },
];

export function CanvasTabs({ view, onChange, chartCount, columnCount }: CanvasTabsProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const counts: Record<CanvasView, number> = {
    charts: chartCount,
    columns: columnCount,
  };

  const move = (delta: number) => {
    const index = TABS.findIndex((tab) => tab.id === view);
    const next = TABS[(index + delta + TABS.length) % TABS.length];
    onChange(next.id);
    // Focus follows selection, which is the expected behaviour for an
    // automatic-activation tablist.
    refs.current[next.id]?.focus();
  };

  return (
    <div role="tablist" aria-label="Canvas view" className="flex items-center gap-1">
      {TABS.map((tab) => {
        const selected = tab.id === view;
        return (
          <button
            key={tab.id}
            ref={(node) => {
              refs.current[tab.id] = node;
            }}
            type="button"
            role="tab"
            id={`canvas-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`canvas-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                move(1);
              } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                move(-1);
              }
            }}
            className={`min-h-11 rounded-md border px-3 py-1.5 text-sm transition-colors motion-reduce:transition-none ${
              selected
                ? 'border-border bg-secondary font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 tabular-nums text-muted-foreground">
              {counts[tab.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
