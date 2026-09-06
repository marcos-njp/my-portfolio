// components/data-analyst-sandbox/data-profiler/chart-text-alternative.tsx
//
// The screen-reader half of Requirement 4.9: a programmatically associated text
// alternative stating the chart type, the source column names, and the plotted
// values, listing at most CHART_TEXT_ALT_VALUE_LIMIT (30) values and stating the
// true total when the series is longer.
//
// It is a real `<table>` rather than a run-on sentence because screen readers
// give tabular data row/column navigation and announce header context per cell;
// a paragraph of 30 comma-separated pairs is unnavigable. `sr-only` is stock
// Tailwind, so no new CSS is introduced.
//
// Presentational only: props in, JSX out. The label helpers live here because
// this module already owns every "how do we describe a ChartSpec in words"
// decision, and `chart-card.tsx` reuses them so the visible and the announced
// descriptions cannot drift apart.
//
// _Requirements: 4.7, 4.9_

import { CHART_TEXT_ALT_VALUE_LIMIT } from '@/lib/data-profiler/constants';
import type { ChartSpec } from '@/lib/data-profiler/types';

/**
 * Locale-independent number formatting. `toLocaleString` is deliberately
 * avoided: this component renders in a client tree whose markup must match what
 * the server produced, and grouping separators differ per locale. Statistics are
 * already rounded to 6dp upstream, so trimming to 6dp here only removes float
 * noise (0.30000000000000004) without changing a recorded value.
 */
export function formatChartNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  return String(Number(value.toFixed(6)));
}

const KIND_LABELS: Record<ChartSpec['kind'], string> = {
  histogram: 'Histogram',
  bar: 'Bar chart',
  line: 'Line chart',
  scatter: 'Scatter plot',
};

/** Visible chart heading. Names the chart type and every source column. */
export function chartTitle(spec: ChartSpec): string {
  switch (spec.kind) {
    case 'histogram':
      return `Histogram of ${spec.column}`;
    case 'bar':
      return `Bar chart of ${spec.column}`;
    case 'line':
      return `Line chart of ${spec.yColumn} over ${spec.xColumn}`;
    case 'scatter':
      return `Scatter plot of ${spec.yColumn} against ${spec.xColumn}`;
  }
}

/** The source column names with their Column_Type, in chart order (Req 4.7). */
export function chartSourceColumns(spec: ChartSpec): Array<{ name: string; type: string }> {
  switch (spec.kind) {
    case 'histogram':
    case 'bar':
      return [{ name: spec.column, type: spec.columnType }];
    case 'line':
    case 'scatter':
      return [
        { name: spec.xColumn, type: spec.xType },
        { name: spec.yColumn, type: spec.yType },
      ];
  }
}

interface AlternativeModel {
  /** One sentence: chart type, source columns, how many values are plotted. */
  summary: string;
  headers: string[];
  rows: string[][];
  /** True plotted total, pre-downsampling for scatter (Req 4.9). */
  total: number;
}

function buildModel(spec: ChartSpec): AlternativeModel {
  const limit = CHART_TEXT_ALT_VALUE_LIMIT;
  const columns = chartSourceColumns(spec)
    .map((column) => `${column.name} (${column.type})`)
    .join(' and ');

  switch (spec.kind) {
    case 'histogram': {
      const rows = spec.bins
        .slice(0, limit)
        .map((bin, index) => [
          String(index + 1),
          `${formatChartNumber(bin.lower)} to ${formatChartNumber(bin.upper)}`,
          String(bin.count),
        ]);
      return {
        summary: `Histogram of ${columns}, ${spec.bins.length} bins.`,
        headers: ['Bin', 'Range', 'Count'],
        rows,
        total: spec.bins.length,
      };
    }
    case 'bar': {
      const rows = spec.points
        .slice(0, limit)
        .map((point) => [point.label, String(point.count)]);
      return {
        summary: `Bar chart of ${columns}, ${spec.points.length} values.`,
        headers: [spec.column, 'Count'],
        rows,
        total: spec.points.length,
      };
    }
    case 'line': {
      const rows = spec.points
        .slice(0, limit)
        .map((point) => [point.x, formatChartNumber(point.y)]);
      return {
        summary: `Line chart of ${columns}, ${spec.points.length} points.`,
        headers: [spec.xColumn, spec.yColumn],
        rows,
        total: spec.points.length,
      };
    }
    case 'scatter': {
      const rows = spec.points
        .slice(0, limit)
        .map((point) => [formatChartNumber(point.x), formatChartNumber(point.y)]);
      // `totalPointCount` is the pairwise-complete total before the fixed-stride
      // downsample, which is the number Requirement 4.9 asks us to state.
      return {
        summary: `Scatter plot of ${columns}, ${spec.totalPointCount} points, correlation ${formatChartNumber(
          spec.coefficient,
        )}.`,
        headers: [spec.xColumn, spec.yColumn],
        rows,
        total: spec.totalPointCount,
      };
    }
  }
}

/**
 * Short `aria-label` for the `role="img"` wrapper. Kept to one sentence so the
 * announcement is not a wall of numbers — the full values live in the table.
 */
export function chartShortLabel(spec: ChartSpec): string {
  return `${KIND_LABELS[spec.kind]}. ${buildModel(spec).summary}`;
}

export interface ChartTextAlternativeProps {
  spec: ChartSpec;
  /** Referenced by the figure's `aria-describedby`. */
  id: string;
  className?: string;
}

export function ChartTextAlternative({ spec, id, className = '' }: ChartTextAlternativeProps) {
  const { summary, headers, rows, total } = buildModel(spec);
  const truncated = total > rows.length;

  return (
    <div id={id} className={`sr-only ${className}`}>
      <table>
        <caption>
          {summary}
          {truncated
            ? ` Showing the first ${rows.length} of ${total} plotted values.`
            : ''}
        </caption>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
