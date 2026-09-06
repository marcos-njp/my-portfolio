"use client"

// components/data-analyst-sandbox/data-profiler/column-profile-table.tsx
//
// Every Column_Profile, rendered as semantic tables. There is no `Table`
// primitive in `components/ui/`, so these are plain `<table>` elements with
// hairline `border-border` rules, a real `<caption>` (visually hidden where the
// surrounding heading already names the table) and `scope="col"` on every
// header cell.
//
// **Why four tables instead of one.** A single table would need a column for
// every statistic of every type — nine numeric figures, plus date bounds, plus
// top values — and would be mostly empty cells, since a statistic only exists
// for one Column_Type. Splitting by type keeps every cell meaningful. The
// overview table is the one that satisfies Requirement 2.8: it lists all
// columns, in header order, with the Column_Type in the cell immediately
// adjacent to the name, `unknown` included.
//
// **Horizontal scrolling.** The numeric statistics table carries nine columns
// and cannot fit 375px. Each table therefore sits in an `overflow-x-auto`
// wrapper, so the table scrolls inside its own box and the *page* never
// scrolls horizontally — which is what Requirement 9.5 forbids.
//
// _Requirements: 2.8, 2.12, 3.2, 3.3, 3.4, 3.5, 3.13_

import type { ColumnProfile, ColumnType } from "@/lib/data-profiler/types"

interface ColumnProfileTableProps {
  columns: ColumnProfile[]
  className?: string
}

const TYPE_LABELS: Record<ColumnType, string> = {
  numeric: "numeric",
  categorical: "categorical",
  datetime: "datetime",
  identifier: "identifier",
  unknown: "unknown",
}

function formatCount(value: number): string {
  return value.toLocaleString("en-US")
}

/** Statistics are already rounded to 6dp upstream; this only formats them. */
function formatStat(value: number): string {
  if (!Number.isFinite(value)) return "n/a"
  return value.toLocaleString("en-US", { maximumFractionDigits: 6 })
}

/**
 * Requirement 3.13: a column with no non-null values carries no type-specific
 * statistics, and the absence has to read as "not computed" rather than as a
 * blank cell that could pass for a zero.
 */
function describeStatsAvailability(column: ColumnProfile): string {
  if (!column.statsComputed) return "Not computed: no non-null values"
  if (column.numeric) return "Numeric summary below"
  if (column.categorical) return "Top values below"
  if (column.datetime) return "Date range below"
  return "No type-specific statistics"
}

const CELL = "px-3 py-2 align-top"
const HEAD_CELL = "px-3 py-2 text-left nm-label-sm whitespace-nowrap"
const NUM_CELL = "px-3 py-2 text-right tabular-nums whitespace-nowrap"
const NUM_HEAD_CELL = "px-3 py-2 text-right nm-label-sm whitespace-nowrap"

/** Shared scroll container. Focusable so a keyboard user can scroll it too. */
function TableScroll({ children }: { children: React.ReactNode }) {
  return (
    <div
      tabIndex={0}
      className="overflow-x-auto rounded-md border border-border bg-card focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      {children}
    </div>
  )
}

export function ColumnProfileTable({ columns, className = "" }: ColumnProfileTableProps) {
  // `flatMap` rather than `filter` so each group carries its statistics as a
  // non-optional field — no non-null assertions in the JSX below.
  const numeric = columns.flatMap((column) =>
    column.numeric ? [{ name: column.name, stats: column.numeric }] : [],
  )
  const categorical = columns.flatMap((column) =>
    column.categorical ? [{ name: column.name, stats: column.categorical }] : [],
  )
  const datetime = columns.flatMap((column) =>
    column.datetime ? [{ name: column.name, stats: column.datetime }] : [],
  )

  if (columns.length === 0) {
    return (
      <p className={`text-sm text-muted-foreground ${className}`}>
        This profile contains no columns.
      </p>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* --- Overview: every column, type adjacent to the name ------------- */}
      <TableScroll>
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <caption className="sr-only">
            Every column in header order, with its inferred type, null count,
            non-null count, distinct value count, and whether type-specific
            statistics were computed.
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className={HEAD_CELL}>
                Column
              </th>
              <th scope="col" className={HEAD_CELL}>
                Type
              </th>
              <th scope="col" className={NUM_HEAD_CELL}>
                Nulls
              </th>
              <th scope="col" className={NUM_HEAD_CELL}>
                Non-null
              </th>
              <th scope="col" className={NUM_HEAD_CELL}>
                Distinct
              </th>
              <th scope="col" className={HEAD_CELL}>
                Statistics
              </th>
            </tr>
          </thead>
          <tbody>
            {columns.map((column) => (
              <tr key={column.name} className="border-b border-border last:border-0">
                <th scope="row" className={`${CELL} text-left font-medium break-words`}>
                  {column.name}
                </th>
                <td className={CELL}>
                  <span className="inline-flex items-center rounded-sm border border-border px-1.5 py-0.5 text-xs text-foreground">
                    {TYPE_LABELS[column.type]}
                  </span>
                  {/* Requirement 2.12: say so when the type could not be settled. */}
                  {column.type === "unknown" && (
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Type could not be determined
                    </span>
                  )}
                </td>
                <td className={NUM_CELL}>{formatCount(column.nullCount)}</td>
                <td className={NUM_CELL}>{formatCount(column.nonNullCount)}</td>
                <td className={NUM_CELL}>{formatCount(column.distinctCount)}</td>
                <td className={`${CELL} text-muted-foreground`}>
                  {describeStatsAvailability(column)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>

      {/* --- Numeric statistics ------------------------------------------- */}
      {numeric.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-base font-medium tracking-tight">Numeric statistics</h3>
          <TableScroll>
            <table className="w-full min-w-[48rem] border-collapse text-sm">
              <caption className="sr-only">
                Minimum, first quartile, median, third quartile, maximum, mean,
                standard deviation and outlier count for each numeric column.
              </caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className={HEAD_CELL}>
                    Column
                  </th>
                  {["Min", "Q1", "Median", "Q3", "Max", "Mean", "Std dev", "Outliers"].map(
                    (heading) => (
                      <th key={heading} scope="col" className={NUM_HEAD_CELL}>
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {numeric.map(({ name, stats }) => (
                  <tr key={name} className="border-b border-border last:border-0">
                    <th scope="row" className={`${CELL} text-left font-medium break-words`}>
                      {name}
                    </th>
                    <td className={NUM_CELL}>{formatStat(stats.min)}</td>
                    <td className={NUM_CELL}>{formatStat(stats.q1)}</td>
                    <td className={NUM_CELL}>{formatStat(stats.median)}</td>
                    <td className={NUM_CELL}>{formatStat(stats.q3)}</td>
                    <td className={NUM_CELL}>{formatStat(stats.max)}</td>
                    <td className={NUM_CELL}>{formatStat(stats.mean)}</td>
                    <td className={NUM_CELL}>{formatStat(stats.stdDev)}</td>
                    <td className={NUM_CELL}>{formatCount(stats.outlierCount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
          <p className="text-xs text-muted-foreground">
            Outliers are values outside the interquartile fences. Quartiles are
            interpolated between the two closest ranks and every figure is
            rounded to 6 decimal places.
          </p>
        </section>
      )}

      {/* --- Datetime ranges ---------------------------------------------- */}
      {datetime.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-base font-medium tracking-tight">Date ranges</h3>
          <TableScroll>
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <caption className="sr-only">
                Earliest and latest parsed date, and the count of values that
                failed to parse, for each datetime column.
              </caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className={HEAD_CELL}>
                    Column
                  </th>
                  <th scope="col" className={HEAD_CELL}>
                    Earliest
                  </th>
                  <th scope="col" className={HEAD_CELL}>
                    Latest
                  </th>
                  <th scope="col" className={NUM_HEAD_CELL}>
                    Unparsed
                  </th>
                </tr>
              </thead>
              <tbody>
                {datetime.map(({ name, stats }) => (
                  <tr key={name} className="border-b border-border last:border-0">
                    <th scope="row" className={`${CELL} text-left font-medium break-words`}>
                      {name}
                    </th>
                    <td className={`${CELL} tabular-nums whitespace-nowrap`}>
                      {stats.earliest}
                    </td>
                    <td className={`${CELL} tabular-nums whitespace-nowrap`}>{stats.latest}</td>
                    <td className={NUM_CELL}>{formatCount(stats.unparsedCount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        </section>
      )}

      {/* --- Categorical top values --------------------------------------- */}
      {categorical.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-base font-medium tracking-tight">Most frequent values</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {categorical.map(({ name, stats }) => (
              <div key={name} className="rounded-md border border-border bg-card p-4 space-y-2">
                <p className="text-sm font-medium break-words">{name}</p>
                <TableScroll>
                  <table className="w-full border-collapse text-sm">
                    <caption className="sr-only">
                      {`Most frequent values in column ${name}, with occurrence counts.`}
                    </caption>
                    <thead>
                      <tr className="border-b border-border">
                        <th scope="col" className={HEAD_CELL}>
                          Value
                        </th>
                        <th scope="col" className={NUM_HEAD_CELL}>
                          Count
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topValues.map((entry) => (
                        <tr
                          key={entry.value}
                          className="border-b border-border last:border-0"
                        >
                          <td className={`${CELL} break-words font-mono text-xs`}>
                            {entry.value}
                          </td>
                          <td className={NUM_CELL}>{formatCount(entry.count)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
