'use client';

// components/data-analyst-sandbox/data-profiler/inspector-rail.tsx
//
// Zone 3 of the workspace: the secondary readings about the dataset that sit
// beside (or below) the charts and column tables.
//
// Three sections: shape (how much data is there), quality (can it be trusted),
// then relationships. Each gets one nm-label heading so the rail is scannable
// without being a wall of unlabeled numbers.
//
// The Ask Nino card sits at the top of this rail rather than in the canvas.
//
// Full width in the canvas would match the home page more literally, and it was
// tried, but the two surfaces are not solving the same problem. On the home page
// the card IS the section, with nothing competing for the space. Here the canvas
// is the work: putting a tall mascot panel above the charts pushes them down and
// undoes the width this layout was rebuilt to reclaim. The rail is the column
// for things you glance at beside the work, which is what a launcher is.
//
// The conversation itself is neither: `ask-dialog.tsx` takes the middle of the
// screen, because a chat wants width and focus that a 300px column cannot give.

import type { DataProfile } from '@/lib/data-profiler/types';

import { AskCard } from './ask-card';
import { CorrelationList } from './correlation-list';
import { ProfileSummary } from './profile-summary';
import { QualityPanel } from './quality-panel';

export interface InspectorRailProps {
  profile: DataProfile;
  hideTruncationNotice: boolean;
  /** Opens the ask dialog. */
  onOpenAsk: () => void;
}

export function InspectorRail({
  profile,
  hideTruncationNotice,
  onOpenAsk,
}: InspectorRailProps) {
  return (
    <div className="space-y-6 pb-8">
      {/* `enabled` is unconditional: the rail only renders once a profile exists.
          The sidebar launcher carries the disabled state, since it is on screen
          before anything is loaded. */}
      <AskCard onOpen={onOpenAsk} enabled />

      <ProfileSummary profile={profile} variant="rail" />

      <section aria-labelledby="quality-heading" className="space-y-2">
        <h2 id="quality-heading" className="nm-label">
          quality
        </h2>
        <QualityPanel
          quality={profile.quality}
          hideTruncationNotice={hideTruncationNotice}
          variant="rail"
        />
      </section>

      <section aria-labelledby="correlations-heading" className="space-y-2">
        <h2 id="correlations-heading" className="nm-label">
          correlations
        </h2>
        {/*
          The table's own sr-only caption still carries the full sentence the
          removed subtitle used to show, so a screen reader loses nothing.
        */}
        <CorrelationList correlations={profile.correlations} variant="rail" />
      </section>
    </div>
  );
}
