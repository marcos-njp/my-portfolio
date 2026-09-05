// lib/data-profiler/type-inference.ts
//
// Column type inference. Pure module: total, deterministic, no ambient clock,
// no randomness, no input mutation, and no throw escapes `inferColumnTypes`.
//
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.10, 2.11, 2.12

import {
  MAX_INFER_COLUMNS,
  MAX_INFER_ROWS,
  TYPE_THRESHOLDS,
} from './constants';
import type { ColumnType, ParsedDataset } from './types';
import { isNullish, parseAcceptedDate, parseFiniteNumber } from './values';

/**
 * The order-independent aggregates a type decision is allowed to read.
 *
 * Every field is a commutative accumulation over the column's cells — three
 * counts and a set cardinality — so no permutation of the data rows can change
 * any of them, and therefore none can change the resulting `ColumnType`
 * (Requirement 2.9). This is structural: `decideType` receives nothing else,
 * so there is no path by which row position could leak into the decision.
 */
interface ColumnAggregates {
  /** Cells that are present, non-empty, and not whitespace-only (Req 2.11). */
  nonNullCount: number;
  /** Non-null cells parsing as finite numbers (Req 2.2). */
  numericCount: number;
  /** Non-null cells parsing as an accepted date format (Req 2.3). */
  dateCount: number;
  /** Distinct non-null cells, compared as exact case-sensitive strings (Req 2.11). */
  distinctCount: number;
}

/**
 * Applies the fixed precedence of Requirement 2.10 — first match wins.
 *
 * Ratios are written as multiplications against `nonNullCount` rather than
 * divisions so the comparison stays exact for the counts involved and cannot
 * divide by zero (the zero case has already short-circuited).
 */
function decideType(agg: ColumnAggregates): ColumnType {
  const { nonNullCount, numericCount, dateCount, distinctCount } = agg;

  // 0. All-null column: assign `unknown` and evaluate nothing else (Req 2.7).
  if (nonNullCount === 0) return 'unknown';

  // 1. numeric (Req 2.2)
  if (numericCount >= TYPE_THRESHOLDS.numericParseRate * nonNullCount) {
    return 'numeric';
  }

  // 2. datetime (Req 2.3)
  if (dateCount >= TYPE_THRESHOLDS.dateParseRate * nonNullCount) {
    return 'datetime';
  }

  // 3. identifier (Req 2.4)
  if (
    distinctCount === nonNullCount &&
    nonNullCount >= TYPE_THRESHOLDS.identifierMinNonNull
  ) {
    return 'identifier';
  }

  // 4. categorical (Req 2.5)
  if (distinctCount <= TYPE_THRESHOLDS.categoricalDistinctRatio * nonNullCount) {
    return 'categorical';
  }

  // 5. otherwise (Req 2.6)
  return 'unknown';
}

/** Accumulator state during the row pass. One entry per column. */
interface ColumnAccumulator {
  nonNullCount: number;
  numericCount: number;
  dateCount: number;
  distinct: Set<string>;
}

function newAccumulators(columnCount: number): ColumnAccumulator[] {
  const accs: ColumnAccumulator[] = new Array(columnCount);
  for (let c = 0; c < columnCount; c += 1) {
    accs[c] = {
      nonNullCount: 0,
      numericCount: 0,
      dateCount: 0,
      distinct: new Set<string>(),
    };
  }
  return accs;
}

/** Folds one cell into a column accumulator. Commutative in the cell order. */
function accumulateCell(acc: ColumnAccumulator, cell: string | undefined): void {
  if (isNullish(cell)) return;
  const value = cell as string;

  acc.nonNullCount += 1;
  acc.distinct.add(value);
  if (parseFiniteNumber(value) !== null) acc.numericCount += 1;
  if (parseAcceptedDate(value) !== null) acc.dateCount += 1;
}

function toAggregates(acc: ColumnAccumulator): ColumnAggregates {
  return {
    nonNullCount: acc.nonNullCount,
    numericCount: acc.numericCount,
    dateCount: acc.dateCount,
    distinctCount: acc.distinct.size,
  };
}

/**
 * Accumulates a single column by index. Only used as the fallback path, so the
 * cost of one pass per column is paid exclusively when the fast path failed.
 */
function accumulateColumn(rows: readonly string[][], index: number): ColumnAggregates {
  const acc: ColumnAccumulator = {
    nonNullCount: 0,
    numericCount: 0,
    dateCount: 0,
    distinct: new Set<string>(),
  };
  for (let r = 0; r < rows.length; r += 1) {
    accumulateCell(acc, rows[r]?.[index]);
  }
  return toAggregates(acc);
}

/**
 * Assigns exactly one `ColumnType` to every column of `dataset`, in header
 * order.
 *
 * Performance (Requirement 2.1): the fast path walks the rows exactly once and
 * folds all four aggregates for every column in that same pass, so a
 * 100,000 x 100 dataset costs one traversal of the cell grid rather than one
 * per column per statistic.
 *
 * Guard semantics (Requirement 2.12): exceeding `MAX_INFER_ROWS` or
 * `MAX_INFER_COLUMNS` is a property of the *whole* dataset, not of an
 * individual column — the requirement names the dataset size as the reason a
 * column cannot be evaluated, and that reason applies equally to every column.
 * So an over-cap dataset yields `unknown` for all of its columns rather than
 * for only those past the column cap. The "retain the assignments already
 * made for the other columns" clause is what governs the *per-column* failure
 * case, which is handled by evaluating each column inside its own try/catch:
 * one column throwing degrades that column to `unknown` and leaves the rest
 * untouched. `ColumnType[]` carries both cases as `unknown`; the UI reads that
 * as "could not be determined" (Requirement 2.8).
 *
 * Never throws. Nothing reachable from here mutates `dataset`.
 */
export function inferColumnTypes(dataset: ParsedDataset): ColumnType[] {
  let columnCount = 0;
  try {
    columnCount = dataset?.headers?.length ?? 0;
  } catch {
    return [];
  }
  if (columnCount === 0) return [];

  const allUnknown = (): ColumnType[] =>
    new Array<ColumnType>(columnCount).fill('unknown');

  let rows: readonly string[][];
  try {
    rows = dataset.rows ?? [];
  } catch {
    return allUnknown();
  }

  // Whole-dataset over-cap guard (Req 2.12) — see the note above.
  if (rows.length > MAX_INFER_ROWS || columnCount > MAX_INFER_COLUMNS) {
    return allUnknown();
  }

  // Fast path: one traversal of the grid, all aggregates for all columns.
  let accumulators: ColumnAccumulator[] | null = null;
  try {
    const accs = newAccumulators(columnCount);
    for (let r = 0; r < rows.length; r += 1) {
      const row = rows[r];
      if (row === undefined || row === null) continue;
      for (let c = 0; c < columnCount; c += 1) {
        accumulateCell(accs[c], row[c]);
      }
    }
    accumulators = accs;
  } catch {
    // Fall through to the per-column path so one problematic column cannot
    // cost every other column its assignment (Req 2.12).
    accumulators = null;
  }

  const types: ColumnType[] = new Array<ColumnType>(columnCount).fill('unknown');
  for (let c = 0; c < columnCount; c += 1) {
    try {
      const agg =
        accumulators === null
          ? accumulateColumn(rows, c)
          : toAggregates(accumulators[c]);
      types[c] = decideType(agg);
    } catch {
      types[c] = 'unknown';
    }
  }

  return types;
}
