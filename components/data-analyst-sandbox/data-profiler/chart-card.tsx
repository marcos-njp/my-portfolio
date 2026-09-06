'use client';

// components/data-analyst-sandbox/data-profiler/chart-card.tsx
//
// One rendered Chart_Spec. A pure switch over `ChartSpec.kind` → Recharts
// element; no business logic, no data derivation. Every series value already
// arrived aggregated in the spec, so this file never touches a raw row.
//
// Accessibility structure is fixed by design.md / Requirement 4.9:
//
//   <figure aria-labelledby={captionId} aria-describedby={altId}>
//     <figcaption id={captionId}>          the 4.7 reason, 1-200 chars
//     <div role="img" aria-label={short}>  Recharts SVG, aria-hidden inside
//     <div id={altId} className="sr-only"> the full text alternative table
//   </figure>
//
// The Recharts subtree is `aria-hidden` so its generated <path>/<text> nodes are
// not announced on top of the text alternative. Nothing inside it is focusable,
// so hiding it removes no keyboard affordance.
//
// Colors are read as `var(--chart-1)`…`var(--chart-5)` — never hex literals, and
// never through a `style` attribute. `chart-4`/`chart-5` are left for
// low-emphasis marks only: in dark mode `chart-5` resolves to a near-black grey
// that all but disappears against the black page background, so primary series
// use `chart-1` through `chart-3`.
//
// The Recharts `<Tooltip>` renders through `content={<ChartTooltip />}`, never
// through `contentStyle`/`labelStyle`/`wrapperStyle`. Those props take literal
// values, and the library's default tooltip paints itself with hardcoded inline
// colors that ignore the theme tokens and go white-on-black in dark mode.
// Owning the surface keeps it on `bg-popover`/`border-border` like every other
// floating panel. See `chart-tooltip.tsx` for why this adds no a11y debt: it
// mounts inside the `aria-hidden` subtree and the sr-only table remains the
// accessible source of every plotted value.
//
// No `<Legend>`: none of the four spec kinds plots more than one series, so a
// legend would render a single entry and spend vertical space saying what the
// `<figcaption>` already says.
//
// _Requirements: 4.6, 4.7, 4.9, 4.12, 9.6_

import { Component, useId, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { HighlightBox } from '@/components/docs/common';
import { Card, CardContent } from '@/components/ui/card';
import type { ChartSpec } from '@/lib/data-profiler/types';
import {
  ChartTextAlternative,
  chartShortLabel,
  chartTitle,
  formatChartNumber,
} from './chart-text-alternative';
import { ChartTooltip } from './chart-tooltip';

/** Axis and grid styling, token-only. Passed as SVG props, not a style attribute. */
const AXIS_TICK = { fill: 'var(--muted-foreground)', fontSize: 11 } as const;
const AXIS_LINE = 'var(--border)';

/**
 * The hover indicator behind the tooltip. An object of SVG presentation props,
 * so the values stay tokens; Recharts applies them to a `<rect>` (categorical
 * charts) or a `<line>` (continuous ones).
 */
const BAND_CURSOR = { fill: 'var(--muted)', fillOpacity: 0.4 } as const;
const LINE_CURSOR = { stroke: 'var(--border)', strokeDasharray: '2 2' } as const;

/**
 * Taller once the viewport is wide enough for the inspector rail to sit beside
 * the canvas rather than under it, where the extra height costs nothing.
 */
const CHART_HEIGHT_CLASS = 'h-72 w-full xl:h-80';

/**
 * Trims an ISO instant to its date for axis and tooltip display.
 *
 * `parseAcceptedDate` normalises every datetime column to a full UTC instant, so
 * the raw tick text is `2024-04-07T00:00:00.000Z`. Six of those across an axis
 * overlap into an unreadable smear, and the time half is noise for a column the
 * profiler classified as a date in the first place. The full value is unchanged
 * in the spec and still appears in the sr-only text alternative.
 */
function formatDateTick(value: unknown): string {
  const text = String(value ?? '');
  const separator = text.indexOf('T');
  return separator === -1 ? text : text.slice(0, separator);
}

interface SeriesProps {
  spec: ChartSpec;
  /** Requirement 9.6: false disables every Recharts animation. */
  animationActive: boolean;
}

function ChartSeries({ spec, animationActive }: SeriesProps) {
  switch (spec.kind) {
    case 'histogram': {
      const data = spec.bins.map((bin) => ({
        label: `${formatChartNumber(bin.lower)} to ${formatChartNumber(bin.upper)}`,
        count: bin.count,
      }));
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={AXIS_LINE} strokeDasharray="2 2" vertical={false} />
            <XAxis dataKey="label" tick={AXIS_TICK} stroke={AXIS_LINE} interval="preserveStartEnd" />
            <YAxis tick={AXIS_TICK} stroke={AXIS_LINE} allowDecimals={false} />
            <Tooltip
              content={<ChartTooltip />}
              cursor={BAND_CURSOR}
              isAnimationActive={animationActive}
              animationDuration={animationActive ? 200 : 0}
            />
            <Bar
              dataKey="count"
              name="rows"
              fill="var(--chart-1)"
              isAnimationActive={animationActive}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={spec.points} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={AXIS_LINE} strokeDasharray="2 2" vertical={false} />
            <XAxis dataKey="label" tick={AXIS_TICK} stroke={AXIS_LINE} interval="preserveStartEnd" />
            <YAxis tick={AXIS_TICK} stroke={AXIS_LINE} allowDecimals={false} />
            <Tooltip
              content={<ChartTooltip />}
              cursor={BAND_CURSOR}
              isAnimationActive={animationActive}
              animationDuration={animationActive ? 200 : 0}
            />
            <Bar
              dataKey="count"
              name="rows"
              fill="var(--chart-2)"
              isAnimationActive={animationActive}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    case 'line':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={spec.points} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={AXIS_LINE} strokeDasharray="2 2" vertical={false} />
            <XAxis
              dataKey="x"
              tick={AXIS_TICK}
              stroke={AXIS_LINE}
              interval="preserveStartEnd"
              minTickGap={32}
              tickFormatter={formatDateTick}
            />
            <YAxis tick={AXIS_TICK} stroke={AXIS_LINE} />
            <Tooltip
              content={<ChartTooltip />}
              cursor={LINE_CURSOR}
              labelFormatter={formatDateTick}
              isAnimationActive={animationActive}
              animationDuration={animationActive ? 200 : 0}
            />
            <Line
              type="monotone"
              dataKey="y"
              name={spec.yColumn}
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={animationActive}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    case 'scatter':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={AXIS_LINE} strokeDasharray="2 2" vertical />
            <XAxis type="number" dataKey="x" name={spec.xColumn} tick={AXIS_TICK} stroke={AXIS_LINE} />
            <YAxis type="number" dataKey="y" name={spec.yColumn} tick={AXIS_TICK} stroke={AXIS_LINE} />
            <Tooltip
              content={<ChartTooltip />}
              cursor={LINE_CURSOR}
              isAnimationActive={animationActive}
              animationDuration={animationActive ? 200 : 0}
            />
            <Scatter
              data={spec.points}
              fill="var(--chart-3)"
              isAnimationActive={animationActive}
            />
          </ScatterChart>
        </ResponsiveContainer>
      );
  }
}

/** Requirement 4.12 message. Rendered in place of the chart, siblings untouched. */
function ChartFailureNotice({ name, detail }: { name: string; detail?: string }) {
  return (
    <div className="rounded-md border border-primary bg-card p-4">
      <p className="nm-label-sm">chart error</p>
      <p className="mt-1 text-sm text-foreground">{`${name} could not be rendered.`}</p>
      {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

interface ChartErrorBoundaryProps {
  /** Named in the inline message so a visitor knows which chart failed. */
  chartName: string;
  onError?: (message: string) => void;
  children: ReactNode;
}

interface ChartErrorBoundaryState {
  message: string | null;
}

/**
 * A per-card error boundary. React only offers this as a class component and
 * `react-error-boundary` is not a dependency, so a small local class is the
 * standard approach. Scoped to one card on purpose: a throw inside one chart
 * unmounts only that subtree, and Requirement 4.12 requires every remaining
 * Chart_Spec to keep rendering in the supplied order.
 */
class ChartErrorBoundary extends Component<ChartErrorBoundaryProps, ChartErrorBoundaryState> {
  state: ChartErrorBoundaryState = { message: null };

  static getDerivedStateFromError(error: unknown): ChartErrorBoundaryState {
    return {
      message: error instanceof Error ? error.message : 'Unknown rendering error.',
    };
  }

  componentDidCatch(error: unknown): void {
    // Callback up: the hook records the failure in `chartErrors` so the message
    // survives a re-render that would otherwise reset this boundary.
    this.props.onError?.(error instanceof Error ? error.message : 'Unknown rendering error.');
  }

  render(): ReactNode {
    if (this.state.message !== null) {
      return <ChartFailureNotice name={this.props.chartName} detail={this.state.message} />;
    }
    return this.props.children;
  }
}

export interface ChartCardProps {
  spec: ChartSpec;
  /** Requirement 9.6. Comes from `useReducedMotion()` in `content.tsx`. */
  reducedMotion?: boolean;
  /** A failure already recorded for this chart by the hook (Requirement 4.12). */
  errorMessage?: string;
  onError?: (message: string) => void;
  className?: string;
}

export function ChartCard({
  spec,
  reducedMotion = false,
  errorMessage,
  onError,
  className = '',
}: ChartCardProps) {
  const baseId = useId();
  const captionId = `${baseId}-caption`;
  const altId = `${baseId}-alt`;
  const title = chartTitle(spec);

  return (
    <Card className={className}>
      <CardContent>
        {errorMessage !== undefined ? (
          <ChartFailureNotice name={title} detail={errorMessage} />
        ) : (
          <ChartErrorBoundary chartName={title} onError={onError}>
            <figure aria-labelledby={captionId} aria-describedby={altId} className="space-y-3">
              <h3 className="text-sm font-medium tracking-tight">{title}</h3>
              {/* The Requirement 4.7 reason: visible here, and the figure's label. */}
              <figcaption id={captionId} className="text-xs text-muted-foreground leading-relaxed">
                {spec.reason}
              </figcaption>
              <div role="img" aria-label={chartShortLabel(spec)}>
                <div aria-hidden="true" className={CHART_HEIGHT_CLASS}>
                  <ChartSeries spec={spec} animationActive={!reducedMotion} />
                </div>
              </div>
              <ChartTextAlternative spec={spec} id={altId} />
            </figure>
            {spec.kind === 'histogram' && spec.unbinnableCount > 0 ? (
              <HighlightBox type="warning" title="Excluded values" className="mt-4">
                {`${spec.unbinnableCount} non-null value${
                  spec.unbinnableCount === 1 ? '' : 's'
                } in ${spec.column} did not parse as a finite number, so they fall in no bin. Bin counts sum to the parseable values only.`}
              </HighlightBox>
            ) : null}
          </ChartErrorBoundary>
        )}
      </CardContent>
    </Card>
  );
}
