'use client';

// components/data-analyst-sandbox/data-profiler/workspace-shell.tsx
//
// The three-zone layout. Zone 1 (section nav) belongs to
// `app/data-analyst-sandbox/layout.tsx`; this file owns zones 2 and 3 inside `<main>`:
//
//   +-----------------+---------------------------+
//   | toolbar                                     |
//   +-----------------+---------------------------+
//   | canvas          | inspector rail            |
//   | charts, columns | summary, quality, ask     |
//   +-----------------+---------------------------+
//
// The rail is a real `<aside>` with `aria-label`, toggled by a button that owns
// `aria-expanded` / `aria-controls` and lives in the toolbar (see
// `workspace-toolbar.tsx`).
//
// --- Why the inspector is rendered once, not twice ---------------------------
//
// Below `xl` there is no room for a side rail, so the inspector stacks under the
// canvas. The obvious implementation is two slots with complementary
// `xl:hidden` / `hidden xl:block` classes, which renders the subtree twice. That
// breaks two things at once: `useId` inside the rail's panels would emit
// duplicate `id` attributes into one document, and the ask panel's
// `role="status"` region would exist twice, so a screen reader announces every
// streamed answer twice. A single JS branch on `useMediaQuery` avoids both.
//
// The rail is hidden with the `hidden` attribute rather than by unmounting, so
// collapsing it does not discard a streamed answer or scroll position.
//
// Tokens only: no literal color or font value (Requirement 9.2), no inline
// `style` attribute, no display face.

import type { ReactNode } from 'react';

/** The breakpoint at which a side rail fits. Matches Tailwind's `xl`. */
export const RAIL_MEDIA_QUERY = '(min-width: 1280px)';

/** The `aria-controls` target of the toolbar's collapse button. */
export const INSPECTOR_ID = 'profiler-inspector';

export interface WorkspaceShellProps {
  /** The full-width row above both zones. */
  toolbar: ReactNode;
  /** Zone 2: the primary work surface. */
  canvas: ReactNode;
  /** Zone 3. Rendered in the rail on wide viewports, below the canvas otherwise. */
  inspector: ReactNode;
  /** Rail open state. Ignored below `xl`, where the inspector always shows. */
  railOpen: boolean;
  /** True once `RAIL_MEDIA_QUERY` matches. False during SSR and first paint. */
  wide: boolean;
}

export function WorkspaceShell({
  toolbar,
  canvas,
  inspector,
  railOpen,
  wide,
}: WorkspaceShellProps) {
  const railVisible = wide && railOpen;

  return (
    <div className="space-y-4">
      {toolbar}

      <div className="flex flex-col gap-4 xl:flex-row xl:gap-6">
        <section className="min-w-0 flex-1 space-y-4">{canvas}</section>

        {wide ? (
          <aside
            id={INSPECTOR_ID}
            aria-label="Inspector"
            hidden={!railVisible}
            className="sticky top-20 max-h-[calc(100vh-6rem)] w-[21rem] flex-shrink-0 overflow-y-auto border-l border-border pl-5 2xl:w-[23rem]"
          >
            {inspector}
          </aside>
        ) : (
          <aside id={INSPECTOR_ID} aria-label="Inspector" className="min-w-0 space-y-4">
            {inspector}
          </aside>
        )}
      </div>
    </div>
  );
}
