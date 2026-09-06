'use client';

// components/data-analyst-sandbox/data-profiler/workspace-toolbar.tsx
//
// The single row of chrome above the workspace.
//
// It replaces a page title, a sixty-word subtitle and two of the nine section
// headings the page used to carry.
//
// Only the things you reach for constantly live here: which file is loaded,
// reset, the rail toggle, and a link to the explanation. The row and column
// counts were removed because the summary panel states them properly two
// inches away, and export moved to the foot of the canvas, because saving a
// report is the last thing you do and a toolbar is where the first things go.
//
// The accessible page name survives as an `sr-only` `<h1>` in `content.tsx`, so
// removing the visible title costs a screen reader user nothing.
//
// Tokens only, no inline style, no display face.

import { PanelRightClose, PanelRightOpen, RotateCcw } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

import { INSPECTOR_ID } from './workspace-shell';

export interface WorkspaceToolbarProps {
  sourceName: string | null;
  canReset: boolean;
  /** Hidden below `xl`, where the inspector always sits under the canvas. */
  showRailToggle: boolean;
  railOpen: boolean;
  onToggleRail: () => void;
  onReset: () => void;
}

export function WorkspaceToolbar({
  sourceName,
  canReset,
  showRailToggle,
  railOpen,
  onToggleRail,
  onReset,
}: WorkspaceToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border pb-3">
      {/*
        Full width below `sm` so the file name gets its own line instead of
        being squeezed against four buttons at 375px.
      */}
      <div className="flex w-full min-w-0 items-baseline gap-3 sm:w-auto sm:flex-1">
        <p className="nm-label-sm shrink-0">profiler</p>
        {sourceName === null ? (
          <p className="truncate text-sm text-muted-foreground">No dataset loaded</p>
        ) : (
          <p className="truncate font-mono text-sm text-foreground">{sourceName}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5">

        {/*
          The `hidden` sits on a wrapper, not on the link. `.nm-link` sets
          `display: inline-flex` in globals.css, and that beats Tailwind's
          `hidden` on the same element, so the link rendered at every width and
          collided with the file name on mobile. Below `sm` the sidebar drawer
          carries this destination anyway.
        */}
        <span className="hidden sm:block">
          <Link href="/data-analyst-sandbox/data-profiler/how-it-works" className="nm-link text-xs">
            How it works
          </Link>
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={!canReset}
          aria-label="Reset the profiler"
          className="min-h-11 min-w-11 motion-reduce:transition-none"
        >
          <RotateCcw aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Reset</span>
        </Button>

        {showRailToggle ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onToggleRail}
            aria-expanded={railOpen}
            aria-controls={INSPECTOR_ID}
            aria-label={railOpen ? 'Hide the inspector' : 'Show the inspector'}
            className="min-h-11 min-w-11 motion-reduce:transition-none"
          >
            {railOpen ? (
              <PanelRightClose aria-hidden="true" />
            ) : (
              <PanelRightOpen aria-hidden="true" />
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
