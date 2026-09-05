// lib/data-profiler/types.ts

export type ColumnType = 'numeric' | 'categorical' | 'datetime' | 'identifier' | 'unknown';

export interface ParseIssue {
  rowIndex: number;
  expectedFieldCount: number;
  actualFieldCount: number;
}

export interface ParsedDataset {
  sourceName: string;
  headers: string[];
  rows: string[][];        // retained rows only, capped at ROW_CAP
  retainedRowCount: number;
  totalRowCount: number;   // as read from the file, may exceed retainedRowCount
  issues: ParseIssue[];
  truncated: boolean;
}

export interface NumericStats {
  min: number; max: number; mean: number; median: number; stdDev: number;
  q1: number; q3: number;
  outlierCount: number;
  lowerBound: number; upperBound: number;   // surfaced by Req 5.5
}

export interface CategoricalStats {
  topValues: Array<{ value: string; count: number }>;   // <= MAX_TOP_VALUES
}

export interface DatetimeStats {
  earliest: string;        // ISO 8601 UTC
  latest: string;
  unparsedCount: number;
}

export interface ColumnProfile {
  name: string;
  type: ColumnType;
  nullCount: number;
  nonNullCount: number;
  distinctCount: number;
  statsComputed: boolean;              // false when nonNullCount === 0 — Req 3.13
  numeric?: NumericStats;
  categorical?: CategoricalStats;
  datetime?: DatetimeStats;
}

export interface CorrelationPair {
  columnA: string;
  columnB: string;
  coefficient: number;    // rounded to 6dp, within [-1, 1]
}

export interface DataProfile {
  sourceName: string;
  retainedRowCount: number;
  totalRowCount: number;
  duplicateRowCount: number;
  columns: ColumnProfile[];            // header order
  correlations: CorrelationPair[];     // descending |coefficient|
  quality: QualityResult;
}

export type ChartKind = 'line' | 'scatter' | 'histogram' | 'bar';

export type ChartSpec =
  | { kind: 'histogram'; column: string; columnType: ColumnType;
      binCount: number;                    // bins.length === binCount — Req 4.2
      bins: Array<{ lower: number; upper: number; count: number }>;
      unbinnableCount: number;             // non-null but non-numeric — see Req 4.10 note
      reason: string }
  | { kind: 'bar'; column: string; columnType: ColumnType;
      points: Array<{ label: string; count: number }>; reason: string }
  | { kind: 'line'; xColumn: string; yColumn: string;
      xType: ColumnType; yType: ColumnType;
      points: Array<{ x: string; y: number }>; reason: string }   // ascending x
  | { kind: 'scatter'; xColumn: string; yColumn: string;
      xType: ColumnType; yType: ColumnType;
      coefficient: number;                 // from the profile, never recomputed from `points`
      points: Array<{ x: number; y: number }>;  // ≤ SCATTER_MAX_POINTS, fixed-stride sample
      totalPointCount: number;             // pairwise-complete total before downsampling — Req 4.9
      reason: string };

export type QualityFactor = 'nulls' | 'duplicates' | 'outliers' | 'unknownTypes';

export interface QualityPenalty {
  factor: QualityFactor;
  weight: number;         // max contribution
  ratio: number;          // 0..1
  penalty: number;        // integer 0..weight
}

export type CleaningIssue = 'nulls' | 'duplicates' | 'outliers' | 'unknownType';

export interface CleaningRecommendation {
  column: string | null;          // null for the dataset-level duplicate row entry
  issue: CleaningIssue;
  factor: QualityFactor;          // drives the 5.7 display order
  detail: string;                 // counts, percentages, IQR bounds
  action: string;
}

export interface QualityResult {
  score: number;                       // integer 0..100
  penalties: QualityPenalty[];         // exactly 4, fixed order
  recommendations: CleaningRecommendation[];
}
