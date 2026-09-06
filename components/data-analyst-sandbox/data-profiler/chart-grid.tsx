'use client';

// components/data-analyst-sandbox/data-profiler/chart-grid.tsx
//
// Renders every supplied Chart_Spec in the supplied order (Requirement 4.6), one
// `ChartCard` per spec, each with its own error boundary so a single failure
// cannot take the row down with it (Requirement 4.12).
//
// When the recommender emitted nothing, Requirement 4.8 requires more than an
// empty state: the name and Column_Type of every column has to be listed, so a
// visitor can see *why* nothing was chartable rather than assuming a bug.
//
// Presentational only. Ordering, capping and reason strings all arrive decided
// from `chart-recommender.ts`; this file never sorts or filters.
//
// _Requirements: 4.6, 4.8, 4.12, 9.5, 9.6_

import { AlertBox } from '@/components/docs/common';
import type { ChartErrorMap } from '@/lib/data-profiler/use-profiler';
import type { ChartSpec, ColumnProfile } from '@/lib/data-profiler/types';
import { ChartCard } from './chart-card';

export interface ChartGridProps {
  charts: ChartSpec[];
  /** Header-order columns, listed verbatim in the Requirement 4.8 empty state. */
  columns: ColumnProfile[];
  /** Requirement 9.6, threaded down to every Recharts series. */
  reducedMotion?: boolean;
  /** Failures recorded by the hook, keyed by index in `charts`. */
  chartErrors?: ChartErrorMap;
  onChartError?: (index: number, message: string) => void;
  /**
   * True when the inspector rail is taking a third of the width. The canvas is
   * then too narrow for two charts side by side, so the grid drops back to one
   * column at `xl` and only splits again at `2xl`.
   *
   * Passed down rather than read from a media query here: a leaf that reads the
   * viewport cannot know the rail is open, and two components computing the same
   * layout independently is how they end up disagreeing.
   */
  dense?: boolean;
  className?: string;
}

export function ChartGrid({
  charts,
  columns,
  reducedMotion = false,
  chartErrors = {},
  onChartError,
  dense = false,
  className = '',
}: ChartGridProps) {
  if (charts.length === 0) {
    return (
      <AlertBox type="info" title="No chartable columns" className={className}>
        <p>
          {columns.length === 0
            ? 'No columns are available to chart yet.'
            : 'This dataset contains no column that meets the criteria for a histogram, bar, line, or scatter chart. Every column and its inferred type:'}
        </p>
        {columns.length > 0 ? (
          <ul className="mt-3 space-y-1">
            {columns.map((column) => (
              <li key={column.name} className="flex flex-wrap items-baseline gap-2 text-xs">
                <span className="font-mono text-foreground">{column.name}</span>
                <span className="nm-label-sm">{column.type}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </AlertBox>
    );
  }

  return (
    // Single column at the base breakpoint (Requirement 9.5); two columns from
    // md. With the rail open, back to one at xl and two again at 2xl.
    <div
      className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${
        dense ? 'xl:grid-cols-1 2xl:grid-cols-2' : ''
      } ${className}`}
    >
      {charts.map((spec, index) => (
        <ChartCard
          key={index}
          spec={spec}
          reducedMotion={reducedMotion}
          errorMessage={chartErrors[index]}
          onError={(message) => onChartError?.(index, message)}
        />
      ))}
    </div>
  );
}
