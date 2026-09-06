'use client';

// components/data-analyst-sandbox/data-profiler/chart-tooltip.tsx
//
// The hover readout for every chart on the profiler.
//
// Recharts ships a tooltip, and this file exists because its default rendering
// cannot be themed. The built-in one paints itself with inline colors that
// ignore the design tokens, so it arrives as a white card on the black page in
// dark mode. Recharts offers `contentStyle` / `labelStyle` / `wrapperStyle` to
// override that, but they take literal values, which is exactly what
// Requirement 9.2 forbids. Passing `content={<ChartTooltip />}` hands the whole
// surface over instead, so it is styled with `bg-popover` / `border-border`
// like every other floating panel on the site and follows the theme for free.
//
// --- Why this adds no accessibility debt -------------------------------------
//
// The tooltip mounts inside the `aria-hidden="true"` wrapper that `chart-card`
// puts around the Recharts subtree, so it is never announced, and it introduces
// no focusable node. It is a pointer convenience layered on top of a channel
// that already exists: every plotted value is in the sr-only table rendered by
// `chart-text-alternative.tsx`, which remains the accessible source of truth.
// Nothing here is the only way to reach a number.
//
// _Requirements: 4.9, 4.12, 9.2, 9.6_

import type { TooltipProps } from 'recharts';

import { formatChartNumber } from './chart-text-alternative';

/**
 * Formats one payload value. Recharts widens these to
 * `string | number | (string | number)[]`, and only the numeric arm goes through
 * `formatChartNumber` (which is locale-independent for hydration safety).
 */
function formatValue(value: unknown): string {
  if (typeof value === 'number') return formatChartNumber(value);
  if (Array.isArray(value)) return value.map(formatValue).join(', ');
  return String(value ?? '');
}

export function ChartTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (active !== true || payload === undefined || payload.length === 0) {
    return null;
  }

  // Bar and line charts label the hovered category or x value; scatter has no
  // single label because both coordinates are already named in the payload.
  const heading = label === undefined || label === null || label === '' ? null : String(label);

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-popover-foreground shadow-sm">
      {heading === null ? null : (
        <p className="nm-label-sm max-w-[16rem] truncate">{heading}</p>
      )}
      <ul className={heading === null ? 'space-y-0.5' : 'mt-1 space-y-0.5'}>
        {payload.map((entry, index) => (
          <li
            key={`${entry.name ?? 'series'}-${index}`}
            className="flex items-baseline justify-between gap-3 text-xs"
          >
            <span className="text-muted-foreground">{entry.name ?? 'value'}</span>
            <span className="font-mono tabular-nums text-foreground">
              {formatValue(entry.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
