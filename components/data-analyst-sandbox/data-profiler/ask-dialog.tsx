'use client';

// components/data-analyst-sandbox/data-profiler/ask-dialog.tsx
//
// "Ask Nino" as a dialog, opened from the inspector rail or the sidebar.
//
// --- One door to the AI ------------------------------------------------------
//
// There are two model paths behind this feature and they are NOT the same call:
//
//   * `/api/profile-qa`        retrieval + streamed text, answers a question.
//   * `/api/profile-insights`  one shot `generateObject`, returns a structured
//                              narrative of summary, observations and next
//                              analyses. The Markdown and JSON exports embed
//                              that structure, which is why it still exists.
//
// They used to be two separate pieces of UI: a chat panel and a red "Generate
// AI insights" button in its own rail section. That put two different front
// doors on one assistant and made the button look like a feature of the report
// rather than something Nino does. Both now run from inside this dialog and
// render as messages from the same character, which is what a visitor expects
// after being introduced to one.
//
// --- Reused from the portfolio chat ------------------------------------------
//
// The transcript styling, the mascot, the rotating idle line and the "Thinking"
// state all come from `components/sections/ai-chat-section.tsx`, deliberately.
// `DigitalNino` is the same component that section renders (size 26 in its
// status line, 84 in its launcher card), so the figure that greets you on the
// home page is the figure that answers here. Two surfaces answering as the same
// character should look like the same character.
//
// --- Why this has a text input and `insight-panel.tsx` still must not --------
//
// The narrative path's guarantee is that no free-text field exists anywhere in
// its payload, so prompt injection is impossible by construction rather than by
// filtering. That is still true: the button below sends no text, only the
// derived payload. The question path is separate end to end and makes a weaker,
// explicit guarantee instead:
//
//   * The question is screened here and again on the server, and reaches the
//     model as a `user` message, never concatenated into the system prompt, so
//     it cannot rewrite the instruction it answers under.
//   * The model sees at most twelve retrieved facts and no rows, because the
//     rows never left this tab. The worst a successful injection achieves is a
//     wrong answer about a CSV the visitor already has open.
//
// --- Provenance --------------------------------------------------------------
//
// A question's reply states how many facts out of how many it was built from
// and names the columns the retriever matched. That line is the honest version
// of "AI powered": it shows the answer came from a ranked subset of this
// profile rather than from the model's own knowledge, and it makes a bad
// retrieval visible instead of leaving it to be inferred from a bad answer.
//
// No lucide icons in this file, by request. The mascot is a canvas, not an
// icon. Rendered as escaped JSX children throughout; no `dangerouslySetInnerHTML`.

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useTheme } from 'next-themes';

import { DigitalNino } from '@/components/digital-nino';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { QUESTION_MAX_LENGTH } from '@/lib/data-profiler/constants';
import type { RetrievedFacts } from '@/lib/data-profiler/fact-retriever';
import type { InsightNarrative } from '@/lib/data-profiler/insight-schema';
import { normalizeCopy } from '@/lib/data-profiler/normalize-copy';

export interface AskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** File name, shown so the visitor knows which dataset is being asked about. */
  sourceName: string;
  /** Size of the retrievable corpus for this profile. */
  factCount: number;

  // Question path
  question: string | null;
  answer: string | null;
  retrieval: RetrievedFacts | null;
  canAsk: boolean;
  pending: boolean;
  errorMessage: string | null;
  onAsk: (question: string) => void;

  // Narrative path
  narrative: InsightNarrative | null;
  canRequestNarrative: boolean;
  narrativePending: boolean;
  narrativeError: string | null;
  onRequestNarrative: () => void;
}

/** Openers. Things a visitor would wonder about a spreadsheet, not a feature tour. */
const SUGGESTIONS = [
  'Which column has the most missing values?',
  'What should I clean first?',
  'Which columns are related?',
] as const;

/**
 * Idle lines, rotated on a timer exactly as the home chat does. They keep the
 * figure alive while nothing is happening, which is the whole point of having a
 * character rather than a send button.
 */
const IDLE_DIALOGUES = [
  'Ask me about the data.',
  'I have every column in front of me.',
  'Want to know what to clean first?',
  'I can tell you which columns move together.',
  'Curious what the quality score is made of?',
] as const;

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function AskDialog({
  open,
  onOpenChange,
  sourceName,
  factCount,
  question,
  answer,
  retrieval,
  canAsk,
  pending,
  errorMessage,
  onAsk,
  narrative,
  canRequestNarrative,
  narrativePending,
  narrativeError,
  onRequestNarrative,
}: AskDialogProps) {
  const { resolvedTheme } = useTheme();
  const mascotTheme: 'dark' | 'light' = resolvedTheme === 'light' ? 'light' : 'dark';

  const [draft, setDraft] = useState('');
  const [idle, setIdle] = useState<string>(IDLE_DIALOGUES[0]);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const busy = pending || narrativePending;

  // Rotate the idle line only while the dialog is open and nothing is running.
  // A timer ticking behind a closed dialog is wasted work, and swapping the
  // line mid-answer would fight the "Thinking" state for the same slot.
  useEffect(() => {
    if (!open || busy) return;
    const timer = setInterval(() => setIdle(pick(IDLE_DIALOGUES)), 4000);
    return () => clearInterval(timer);
  }, [open, busy]);

  // Follow the reply as it streams, so a long answer does not run off the
  // bottom of the transcript while the visitor is reading the top of it.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [answer, narrative, busy, errorMessage, narrativeError]);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (trimmed.length === 0 || !canAsk) return;
      setDraft('');
      onAsk(trimmed);
      inputRef.current?.focus();
    },
    [canAsk, onAsk],
  );

  const submit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      send(draft);
    },
    [draft, send],
  );

  const hasTurn = question !== null || pending;
  const hasNarrative = narrative !== null || narrativePending;
  const showOpeners = !hasTurn && !hasNarrative;
  const failure = errorMessage ?? narrativeError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-[680px] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 pr-12 text-left">
          <DialogTitle className="text-base font-medium">Ask Nino</DialogTitle>
          <DialogDescription className="text-xs">
            {`Answers come from the ${factCount} statistics derived from ${sourceName}. Your rows stay in this tab.`}
          </DialogDescription>
        </DialogHeader>

        {/* --- Transcript ---------------------------------------------------- */}
        <div className="min-h-[15rem] flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {/* The greeting is not a message, so it is not styled as one. */}
          <div className="space-y-1.5">
            <p className="nm-label-sm px-0.5">Nino</p>
            <div className="max-w-[88%] rounded-sm border border-border bg-card px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
              Ask me about this data. I have the column types, the distributions,
              the correlations and the quality score in front of me, so I can tell
              you what is in here and what to fix first.
            </div>
          </div>

          {/* --- The rundown, when it was asked for -------------------------- */}
          {hasNarrative ? (
            <>
              <div className="flex flex-col items-end gap-1.5">
                <p className="nm-label-sm px-0.5">You</p>
                <div className="max-w-[85%] rounded-sm bg-foreground px-3.5 py-2.5 text-sm leading-relaxed text-background">
                  Give me the full rundown.
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="nm-label-sm px-0.5">Nino</p>
                <div role="status" aria-live="polite" aria-busy={narrativePending}>
                  {narrative === null ? null : (
                    <div className="max-w-[92%] space-y-3 rounded-sm border border-border bg-card px-3.5 py-3 text-sm leading-relaxed text-foreground">
                      <p>{normalizeCopy(narrative.summary)}</p>

                      <div className="space-y-1.5">
                        <p className="nm-label-sm">What stands out</p>
                        <ul className="space-y-1">
                          {narrative.observations.map((observation, index) => (
                            <li key={index} className="border-l border-border pl-3">
                              {normalizeCopy(observation)}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-1.5">
                        <p className="nm-label-sm">What to look at next</p>
                        <ul className="space-y-1">
                          {narrative.nextAnalyses.map((suggestion, index) => (
                            <li key={index} className="border-l border-border pl-3">
                              {normalizeCopy(suggestion)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}

          {/* --- A question and its answer ----------------------------------- */}
          {hasTurn ? (
            <>
              {question === null ? null : (
                <div className="flex flex-col items-end gap-1.5">
                  <p className="nm-label-sm px-0.5">You</p>
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-sm bg-foreground px-3.5 py-2.5 text-sm leading-relaxed text-background">
                    {question}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <p className="nm-label-sm px-0.5">Nino</p>
                {/*
                  `aria-live="polite"` with `aria-busy` while streaming, so a
                  screen reader announces the settled answer rather than every
                  chunk as it lands.
                */}
                <div role="status" aria-live="polite" aria-busy={pending}>
                  {answer === null ? null : (
                    <div className="max-w-[92%] whitespace-pre-wrap rounded-sm border border-border bg-card px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
                      {normalizeCopy(answer)}
                    </div>
                  )}
                </div>

                {retrieval !== null && !pending && answer !== null ? (
                  <p className="px-0.5 text-xs text-muted-foreground">
                    {`Grounded in ${retrieval.facts.length} of ${retrieval.totalFacts} facts` +
                      (retrieval.matchedColumns.length > 0
                        ? `, matching ${retrieval.matchedColumns.join(', ')}`
                        : '') +
                      '.'}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}

          {failure !== null ? (
            <div
              role="alert"
              className="rounded-sm border border-primary bg-card px-3.5 py-2.5 text-sm text-foreground"
            >
              {failure}
            </div>
          ) : null}

          <div ref={endRef} />
        </div>

        {/* --- Openers -------------------------------------------------------- */}
        {showOpeners ? (
          <div className="shrink-0 space-y-1.5 px-5 pb-3">
            <ul className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => send(suggestion)}
                    disabled={!canAsk}
                    className="rounded-sm border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50 motion-reduce:transition-none"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
              {/*
                The former "Generate AI insights" button. Same endpoint, same
                payload, now phrased as something you ask rather than a control
                you operate, and answered in the same voice as everything else
                in this transcript.
              */}
              <li>
                <button
                  type="button"
                  onClick={onRequestNarrative}
                  disabled={!canRequestNarrative}
                  className="rounded-sm border border-primary px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-secondary disabled:opacity-50 motion-reduce:transition-none"
                >
                  Give me the full rundown
                </button>
              </li>
            </ul>
          </div>
        ) : null}

        {/* --- Companion status line ------------------------------------------ */}
        {/*
          Lifted from the home chat's own status strip: the mascot at size 26,
          talking while a request is in flight, with the idle line beside it.
        */}
        <div className="flex shrink-0 items-center gap-2 border-t border-border px-4 py-2">
          <div className="-my-3 shrink-0">
            <DigitalNino
              size={26}
              mood={failure !== null ? 'shocked' : 'normal'}
              isTalking={busy}
              theme={mascotTheme}
            />
          </div>
          <span className="truncate text-xs text-muted-foreground">
            {busy ? 'Thinking...' : idle}
          </span>
        </div>

        {/* --- Composer ------------------------------------------------------- */}
        <form onSubmit={submit} className="shrink-0 border-t border-border p-3">
          <label htmlFor="ask-dialog-input" className="sr-only">
            Ask a question about this dataset
          </label>
          <div className="flex items-end gap-2">
            <textarea
              id="ask-dialog-input"
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                // Enter sends, Shift+Enter breaks the line, matching the
                // portfolio chat. The submit button still works for anyone
                // navigating by keyboard rather than typing into the field.
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  send(draft);
                }
              }}
              rows={1}
              maxLength={QUESTION_MAX_LENGTH}
              placeholder="Ask about a column, a correlation, or what to clean"
              className="min-h-11 w-full resize-none rounded-sm border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <button
              type="submit"
              disabled={!canAsk || draft.trim().length === 0}
              className="min-h-11 shrink-0 rounded-sm border border-border bg-foreground px-4 text-sm font-medium text-background transition-colors hover:opacity-90 disabled:opacity-40 motion-reduce:transition-none"
            >
              {pending ? 'Asking' : 'Ask'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
