'use client';

// components/data-analyst-sandbox/data-profiler/ask-card.tsx
//
// The mascot card that opens the ask dialog from the data profiler canvas.
//
// Uses the shared NinoCard component so the visual identity matches the home
// page's "Meet Digital Nino" trigger card exactly: same speech bubble, same
// mascot, same dot-grid background, same panel styling.
//
// The one addition is the privacy note at the bottom, and it has to be exact.
//
// Retrieval runs in the browser, but the question and the facts it selected DO
// go to `/api/profile-qa` and on to Groq. That is how an answer gets written. An
// earlier draft of this line said "nothing is sent to a server", which is the
// one claim the feature cannot make. What never leaves the tab is the raw rows,
// which is precisely what `no-transmission.test.ts` asserts, so that is what the
// note says.

import { NinoCard } from '@/components/nino-card';

const IDLE_DIALOGUES = [
  'Ask me about the data.',
  'I have every column in front of me.',
  'Want to know what to clean first?',
  'I can tell you which columns move together.',
] as const;

export interface AskCardProps {
  onOpen: () => void;
  /** False before a profile exists, when there is nothing to ask about. */
  enabled: boolean;
}

export function AskCard({ onOpen, enabled }: AskCardProps) {
  return (
    <NinoCard
      onClick={onOpen}
      enabled={enabled}
      dialogues={IDLE_DIALOGUES}
      title="Ask Nino"
      subtitle="Questions about this dataset, answered from its own statistics."
      ctaLabel="Start chat"
      note="Your rows stay in this tab. Retrieval runs here; only the statistics needed to answer go to the model."
      mascotSize={72}
    />
  );
}
