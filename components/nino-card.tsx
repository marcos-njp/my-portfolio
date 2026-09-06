'use client';

// components/nino-card.tsx
//
// Reusable trigger card for the Digital Nino character. Used on the home page
// ("Meet Digital Nino") and the Data Analyst Sandbox ("Ask Nino"). Both surfaces share the
// same visual identity: a speech bubble with a tail, the DigitalNino mascot
// beneath it, a title, a subtitle, and a call-to-action link.
//
// The card renders as a single <button> so the entire surface is clickable and
// Tab reaches it once. The dot-grid background, the nm-panel border, and the
// backdrop-blurred bubble all come from the home page's original card and are
// preserved here so neither surface can drift from the other.

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

import { DigitalNino } from '@/components/digital-nino';

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export interface NinoCardProps {
  /** Click handler for the whole card. */
  onClick: () => void;
  /** False when the card should be visible but non-interactive. */
  enabled?: boolean;
  /** Rotating speech bubble lines. */
  dialogues: readonly string[];
  /** Large heading below the mascot. */
  title: string;
  /** One-line description below the title. */
  subtitle: string;
  /** CTA label shown as the accent link. */
  ctaLabel: string;
  /** Optional line below the CTA, used for privacy notes and similar. */
  note?: string;
  /** Mascot size in px. Defaults to 84. */
  mascotSize?: number;
}

export function NinoCard({
  onClick,
  enabled = true,
  dialogues,
  title,
  subtitle,
  ctaLabel,
  note,
  mascotSize = 84,
}: NinoCardProps) {
  const { resolvedTheme } = useTheme();
  const mascotTheme: 'dark' | 'light' = resolvedTheme === 'light' ? 'light' : 'dark';

  const [line, setLine] = useState<string>(dialogues[0]);

  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => setLine(pick(dialogues)), 4000);
    return () => clearInterval(timer);
  }, [enabled, dialogues]);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      className="w-full nm-panel nm-hover relative overflow-hidden text-center p-8 group disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:border-border"
    >
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />
      <div className="relative flex flex-col items-center gap-3">
        <div className="flex flex-col items-center pointer-events-none">
          <div className="relative mb-1">
            <div className="bg-background/60 border border-border rounded-sm px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm font-ntype">
              {enabled ? line : dialogues[0]}
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-[7px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] border-t-border" />
          </div>
          <DigitalNino size={mascotSize} mood="normal" isTalking={false} theme={mascotTheme} />
        </div>

        <div>
          <p className="text-xl font-medium">{title}</p>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <span className="nm-link nm-link-accent text-sm">{ctaLabel}</span>

        {note ? (
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
            {note}
          </p>
        ) : null}
      </div>
    </button>
  );
}
