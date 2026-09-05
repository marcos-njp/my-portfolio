// lib/data-profiler/report-exporter.ts
//
// Serializes a `DataProfile` (plus the optional AI narrative) into a Markdown
// document and a JSON document. Pure module: total, deterministic, no ambient
// clock, no randomness, no DOM, no input mutation. Handing the string to the
// browser is `download.ts`'s job.
//
// _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6_
//
// --- The one impure input is a parameter --------------------------------------
//
// Requirement 7.3 needs an export timestamp, which is the only value here that
// cannot be derived from the profile. Calling `new Date()` inside these
// functions would make them non-deterministic and untestable without fake
// timers, so the caller supplies it as `ReportInput.exportedAt`. Tasks 11.2
// (unit tests), 12.1 (the state machine that wires the export controls) and 13.8
// (export control component) all call through `ReportInput`, so the shape is
// documented on the interface below and should be treated as the contract.
//
// --- JSON round trip (Property 10, Requirement 7.6) --------------------------
//
// Property 10 asserts: for any `DataProfile`, deserializing the JSON document
// yields a `DataProfile` deeply equal to the input. That only works if the
// profile is a *distinct addressable value* inside the envelope rather than
// being spread across it, so the document shape is:
//
// ```json
// {
//   "document": "csv-data-profiler-report",
//   "version": 1,
//   "exportedAt": "2024-05-04T12:13:14.000Z",
//   "narrativeGenerated": false,
//   "narrative": null,
//   "profile": { ...the DataProfile, verbatim... }
// }
// ```
//
// **`JSON.parse(toJsonReport({ profile, ... })).profile` is the profile.** It is
// copied field-for-field with no renaming, no added or dropped keys, no
// reordering of arrays, and no reformatting of numbers — the envelope wraps it,
// it does not transform it. That is the extraction path the property test uses,
// and the reason `exportedAt` and the narrative live *outside* `profile` rather
// than being merged into it (merging would add keys a `DataProfile` does not
// have, and the round trip would fail on the extra fields).
//
// Values that can break a JSON round trip, and why they do not arise here:
//
// - **`-0` → `0`.** `JSON.stringify(-0)` is `"0"`, and a deep-equal that uses
//   `Object.is` on numbers (Vitest's `toEqual` does) treats `0` and `-0` as
//   different. `round6` can produce `-0`, but no `-0` ever reaches a profile
//   from real input: a CSV cell is text, `String(-0)` is `"0"`, and there is no
//   decimal spelling of negative zero — the profiler's own property tests
//   document this. `generators.ts` closes the synthetic path too: its
//   `safeDouble` normalises `-0` to `0` precisely so Property 10 is not failed
//   by an artefact of the generator.
// - **`undefined` values silently dropped.** `JSON.stringify({ a: undefined })`
//   is `"{}"`, so a profile carrying `numeric: undefined` would come back
//   without the key and fail a deep-equal against the input. Confirmed against
//   `profiler.ts`: the optional blocks are *omitted*, never assigned
//   `undefined` — each is conditionally assigned only when its finalizer
//   returned non-null (`if (numeric !== null) profile.numeric = numeric;`), and
//   the `nonNullCount === 0` branch builds an object literal with no optional
//   keys at all. So a key is either present with a value or absent, and absence
//   survives the round trip exactly.
// - **`NaN` / `±Infinity` → `null`.** Every recorded statistic comes from
//   `parseFiniteNumber`, which rejects both, and counts are integers, so no
//   non-finite value is produced from ordinary data. The one theoretical
//   exception is `outlierBounds` on a column spanning the full double range
//   (`q1 ≈ -1e308`, `q3 ≈ 1e308`), where `q3 + 1.5 * iqr` overflows to
//   `Infinity`; such a column cannot come from a plausible dataset and is
//   outside Property 10's generator domain. Left as a documented edge rather
//   than clamped, because clamping would silently misreport a real fence.
//
// --- Markdown escaping is formatting hygiene, NOT XSS defence ----------------
//
// Column names, top values and the source dataset name are visitor-supplied and
// can contain pipes, backticks, backslashes and newlines. A column literally
// named `| x |` would split a table row into the wrong number of cells, so
// table cells are escaped (see `escapeTableCell`). That is *readability*
// protection — a visitor may share this file, and a corrupted table is a bad
// portfolio artefact.
//
// It is explicitly **not** a sanitizer. Requirement 7.5 has this string only
// ever handed to a `Blob` and downloaded; nothing parses it back, and nothing
// injects it into the DOM (the project bans `dangerouslySetInnerHTML`
// outright). So there is no XSS surface here today. Saying that out loud
// because the caveat matters if that ever changes: Markdown renderers pass raw
// HTML through by default, so **anyone who renders this document must sanitize
// it first** — this module does not HTML-escape, deliberately, since `&lt;` in a
// plain-text file people actually read is worse than useless.
//
// The Markdown document is a presentation format and loses a little fidelity by
// design (newlines inside a value collapse to a space, because a GFM table row
// cannot contain one). The JSON document is the faithful one; that is the
// division of labour between the two formats.

import type {
  CleaningIssue,
  ColumnProfile,
  DataProfile,
  QualityFactor,
} from './types';
import type { InsightNarrative } from './insight-schema';

/**
 * Everything the exporters need. One shape for both formats so a caller can
 * build it once and offer both downloads.
 *
 * @property profile    The profile to serialize. Never mutated.
 * @property narrative  The validated AI narrative, or `null` when none was
 *                      requested, none arrived, or the request failed. `null`
 *                      takes the Requirement 7.4 branch: every other section is
 *                      populated and the narrative section is *marked* as not
 *                      generated rather than omitted.
 * @property exportedAt The export instant. Supplied by the caller because this
 *                      module reads no clock. Rendered as an ISO 8601 UTC
 *                      string (Requirement 7.3).
 */
export interface ReportInput {
  profile: DataProfile;
  narrative: InsightNarrative | null;
  exportedAt: Date;
}

/** Which document a caller is asking for. */
export type ReportFormat = 'markdown' | 'json';

/** File extension per format, including the leading dot (Requirements 7.1, 7.2). */
export const REPORT_EXTENSIONS: Record<ReportFormat, string> = {
  markdown: '.md',
  json: '.json',
};

/** MIME type per format, for the `Blob` handed to `triggerDownload`. */
export const REPORT_MIME_TYPES: Record<ReportFormat, string> = {
  markdown: 'text/markdown',
  json: 'application/json',
};

/** Marker used wherever a section has no content to show. */
const NOT_GENERATED = '_Not generated._';

/** Longest sanitized dataset stem allowed in a download file name. */
const MAX_FILE_NAME_STEM = 80;

const FACTOR_LABELS: Record<QualityFactor, string> = {
  nulls: 'Missing values',
  duplicates: 'Duplicate rows',
  outliers: 'Outliers',
  unknownTypes: 'Undetermined column types',
};

const ISSUE_LABELS: Record<CleaningIssue, string> = {
  nulls: 'Missing values',
  duplicates: 'Duplicate rows',
  outliers: 'Outliers',
  unknownType: 'Undetermined column type',
};

// --- Formatting primitives ---------------------------------------------------

/**
 * The export timestamp as an ISO 8601 UTC string.
 *
 * @throws When `exportedAt` is an invalid `Date`. This is the single throwing
 * path in the module and it is a caller bug, not a data condition — but it is
 * also exactly what Requirement 7.8 is for: the caller catches, reports "no file
 * was saved" naming the format, and re-enables the control. `toISOString()`
 * would throw here anyway; the guard just makes the message legible.
 */
function isoTimestamp(exportedAt: Date): string {
  const ms = exportedAt.getTime();
  if (!Number.isFinite(ms)) {
    throw new Error('report-exporter: exportedAt must be a valid Date.');
  }
  return new Date(ms).toISOString();
}

/**
 * Renders a number for human reading. Profile statistics are already rounded to
 * six decimals by `round6`, so `String` is exact and adds no noise. Non-finite
 * values are spelled out rather than printed as `null` — see the header note on
 * the `outlierBounds` overflow edge.
 */
function num(value: number): string {
  if (Number.isNaN(value)) return 'NaN';
  if (value === Infinity) return 'Infinity';
  if (value === -Infinity) return '-Infinity';
  return String(value);
}

/** A ratio in [0,1] as a percentage with two decimals. */
function pct(ratio: number): string {
  if (!Number.isFinite(ratio)) return '—';
  return `${(ratio * 100).toFixed(2)}%`;
}

/**
 * Escapes a visitor-supplied string for use in Markdown running text.
 *
 * Backslashes are doubled first so the escapes added afterwards are
 * unambiguous, and so a value *ending* in a backslash cannot escape whatever
 * character follows it. Backticks are escaped so a stray one cannot open an
 * inline code span that swallows the rest of the line. CR, LF and CRLF collapse
 * to a single space: a newline inside a table cell is unrepresentable in GFM,
 * and allowing one anywhere in a generated line risks splitting a construct in
 * half.
 *
 * Not an HTML sanitizer — see the module header.
 */
function escapeInline(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\r\n|[\r\n]/g, ' ');
}

/**
 * Escapes a value for a GFM table cell: everything `escapeInline` does, plus
 * pipes, which are the cell delimiter. A column named `| x |` therefore lands in
 * one cell instead of shifting every following column left.
 *
 * An empty or whitespace-only value renders as a visible marker so a blank cell
 * is not mistaken for a broken row.
 */
function escapeTableCell(value: string): string {
  const escaped = escapeInline(value).replace(/\|/g, '\\|');
  return escaped.trim() === '' ? '_(empty)_' : escaped;
}

/** A GFM table: header row, alignment row, then body rows. */
function table(headers: string[], rows: string[][]): string[] {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((cells) => `| ${cells.join(' | ')} |`),
  ];
}

// --- File names (Requirements 7.1, 7.2) --------------------------------------

/**
 * Reduces a visitor-supplied dataset name to a stem safe to use in a download
 * file name.
 *
 * This is logic, not presentation, so it lives here rather than in the export
 * control component: a visitor's file name can carry path separators, colons,
 * control characters, a trailing dot, or a Windows reserved device name, none of
 * which belong in a `download` attribute. Steps, in order:
 *
 * 1. Drop a trailing `.csv` — the output is not a CSV, and `sales.csv-...md`
 *    reads badly.
 * 2. Replace every character illegal on Windows or meaningful to a path
 *    (`< > : " / \ | ? *`), plus C0 control characters, with `-`.
 * 3. Collapse whitespace and runs of `-` into a single `-`, and trim `-` and
 *    `.` from both ends (a trailing dot is illegal on Windows).
 * 4. Prefix a Windows reserved device name (`CON`, `NUL`, `COM1`, …), which
 *    cannot be used as a file name even with an extension.
 * 5. Cap the length so the full name stays comfortably inside filesystem
 *    limits, and fall back to `dataset` if nothing usable survives.
 *
 * Non-ASCII is deliberately preserved: `売上-profile-….md` is a perfectly valid
 * file name and mangling it would be worse than leaving it.
 */
export function sanitizeDatasetStem(sourceName: string): string {
  const withoutCsv = sourceName.replace(/\.csv$/i, '');

  const cleaned = withoutCsv
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '');

  const stem = cleaned.slice(0, MAX_FILE_NAME_STEM).replace(/[-.]+$/g, '');
  if (stem === '') return 'dataset';

  return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(stem) ? `dataset-${stem}` : stem;
}

/**
 * The export instant as a file-name-safe token, e.g. `2024-05-04T12-13-14Z`.
 *
 * Colons are illegal in Windows file names, so the ISO time separators become
 * `-`; milliseconds are dropped as noise. The date part keeps its dashes so the
 * timestamp is still readable at a glance.
 */
function fileNameTimestamp(exportedAt: Date): string {
  const iso = isoTimestamp(exportedAt);
  const [datePart, timePart] = iso.split('T');
  return `${datePart}T${timePart.slice(0, 8).replace(/:/g, '-')}Z`;
}

/**
 * Download file name for a report: sanitized dataset name, the export
 * timestamp, and the extension for the format (Requirements 7.1, 7.2).
 *
 * e.g. `sales-2024-profile-2024-05-04T12-13-14Z.md`
 */
export function reportFileName(
  sourceName: string,
  exportedAt: Date,
  format: ReportFormat,
): string {
  return `${sanitizeDatasetStem(sourceName)}-profile-${fileNameTimestamp(exportedAt)}${REPORT_EXTENSIONS[format]}`;
}

// --- Markdown ----------------------------------------------------------------

function overviewSection(profile: DataProfile, timestamp: string): string[] {
  return [
    `# Data profile — ${escapeInline(profile.sourceName)}`,
    '',
    `- **Source dataset:** ${escapeInline(profile.sourceName)}`,
    `- **Exported (UTC):** ${timestamp}`,
    `- **Retained rows:** ${num(profile.retainedRowCount)}`,
    `- **Total rows read:** ${num(profile.totalRowCount)}`,
    `- **Duplicate rows:** ${num(profile.duplicateRowCount)}`,
    `- **Columns:** ${num(profile.columns.length)}`,
    `- **Quality score:** ${num(profile.quality.score)} / 100`,
    '',
  ];
}

function qualitySection(profile: DataProfile): string[] {
  const { quality } = profile;
  const lines: string[] = [
    '## Data quality',
    '',
    `Quality score: **${num(quality.score)} / 100**. The score starts at 100 and`,
    'subtracts one weighted penalty per factor.',
    '',
    ...table(
      ['Factor', 'Weight', 'Ratio', 'Penalty'],
      quality.penalties.map((p) => [
        escapeTableCell(FACTOR_LABELS[p.factor] ?? p.factor),
        num(p.weight),
        pct(p.ratio),
        num(p.penalty),
      ]),
    ),
    '',
    '### Cleaning recommendations',
    '',
  ];

  if (quality.recommendations.length === 0) {
    lines.push('No cleaning actions required.', '');
    return lines;
  }

  lines.push(
    // Every recommendation, not the 100 the UI renders — MAX_RENDERED_RECOMMENDATIONS
    // is a display cap; Requirement 7.3 asks the export for all of them.
    ...table(
      ['Column', 'Issue', 'Detail', 'Recommended action'],
      quality.recommendations.map((r) => [
        r.column === null ? '_(whole dataset)_' : escapeTableCell(r.column),
        escapeTableCell(ISSUE_LABELS[r.issue] ?? r.issue),
        escapeTableCell(r.detail),
        escapeTableCell(r.action),
      ]),
    ),
    '',
  );
  return lines;
}

function columnsSection(columns: ColumnProfile[]): string[] {
  const lines: string[] = ['## Columns', ''];

  if (columns.length === 0) {
    lines.push('No columns were profiled.', '');
    return lines;
  }

  lines.push(
    ...table(
      ['#', 'Column', 'Type', 'Nulls', 'Non-null', 'Distinct', 'Statistics'],
      columns.map((c, i) => [
        String(i + 1),
        escapeTableCell(c.name),
        c.type,
        num(c.nullCount),
        num(c.nonNullCount),
        num(c.distinctCount),
        c.statsComputed ? 'computed' : 'not computed',
      ]),
    ),
    '',
  );

  const numericColumns = columns.filter((c) => c.numeric !== undefined);
  if (numericColumns.length > 0) {
    lines.push(
      '### Numeric statistics',
      '',
      ...table(
        [
          'Column', 'Min', 'Q1', 'Median', 'Q3', 'Max', 'Mean', 'Std dev',
          'Outliers', 'Lower fence', 'Upper fence',
        ],
        numericColumns.map((c) => {
          const s = c.numeric!;
          return [
            escapeTableCell(c.name),
            num(s.min), num(s.q1), num(s.median), num(s.q3), num(s.max),
            num(s.mean), num(s.stdDev), num(s.outlierCount),
            num(s.lowerBound), num(s.upperBound),
          ];
        }),
      ),
      '',
    );
  }

  const categoricalColumns = columns.filter((c) => c.categorical !== undefined);
  if (categoricalColumns.length > 0) {
    lines.push('### Most frequent values', '');
    categoricalColumns.forEach((c) => {
      lines.push(
        `**${escapeInline(c.name)}**`,
        '',
        ...table(
          ['Value', 'Count'],
          c.categorical!.topValues.map((t) => [escapeTableCell(t.value), num(t.count)]),
        ),
        '',
      );
    });
  }

  const datetimeColumns = columns.filter((c) => c.datetime !== undefined);
  if (datetimeColumns.length > 0) {
    lines.push(
      '### Date ranges',
      '',
      ...table(
        ['Column', 'Earliest', 'Latest', 'Unparsed values'],
        datetimeColumns.map((c) => [
          escapeTableCell(c.name),
          escapeTableCell(c.datetime!.earliest),
          escapeTableCell(c.datetime!.latest),
          num(c.datetime!.unparsedCount),
        ]),
      ),
      '',
    );
  }

  return lines;
}

function correlationsSection(profile: DataProfile): string[] {
  const lines: string[] = ['## Correlations', ''];

  if (profile.correlations.length === 0) {
    lines.push('No correlation pairs were computed.', '');
    return lines;
  }

  lines.push(
    'Pearson coefficients over pairwise-complete rows, strongest first.',
    '',
    ...table(
      ['Column A', 'Column B', 'Coefficient'],
      profile.correlations.map((c) => [
        escapeTableCell(c.columnA),
        escapeTableCell(c.columnB),
        num(c.coefficient),
      ]),
    ),
    '',
  );
  return lines;
}

function narrativeSection(narrative: InsightNarrative | null): string[] {
  const lines: string[] = ['## AI narrative', ''];

  // Requirement 7.4: mark it as not generated, never silently omit the section.
  if (narrative === null) {
    lines.push(
      NOT_GENERATED,
      '',
      'No AI narrative was available when this report was exported. Every other',
      'section above is complete.',
      '',
    );
    return lines;
  }

  lines.push(
    '### Summary',
    '',
    escapeInline(narrative.summary),
    '',
    '### Observations',
    '',
    ...narrative.observations.map((o) => `- ${escapeInline(o)}`),
    '',
    '### Suggested next analyses',
    '',
    ...narrative.nextAnalyses.map((n) => `- ${escapeInline(n)}`),
    '',
  );
  return lines;
}

/**
 * The profile as a readable Markdown document.
 *
 * Sections, in order: overview (source dataset name, export timestamp, row
 * counts, duplicate count, quality score), data quality (penalty table +
 * every cleaning recommendation), columns (one row per `ColumnProfile`, plus
 * per-type statistic tables), correlations (every `CorrelationPair`), and the
 * AI narrative — which is always present as a section and marked
 * `_Not generated._` when absent (Requirement 7.4).
 *
 * Pure: reads `input`, returns a string, mutates nothing.
 */
export function toMarkdownReport(input: ReportInput): string {
  const { profile, narrative, exportedAt } = input;
  const timestamp = isoTimestamp(exportedAt);

  const lines: string[] = [
    ...overviewSection(profile, timestamp),
    ...qualitySection(profile),
    ...columnsSection(profile.columns),
    ...correlationsSection(profile),
    ...narrativeSection(narrative),
    '---',
    '',
    `Generated in the browser from derived statistics only. Exported ${timestamp}.`,
    '',
  ];

  return lines.join('\n');
}

// --- JSON --------------------------------------------------------------------

/**
 * The JSON document's shape. `profile` carries the `DataProfile` verbatim, which
 * is what makes the Requirement 7.6 / Property 10 round trip exact — see the
 * module header for the extraction path and the round-trip hazards.
 */
export interface JsonReportDocument {
  document: 'csv-data-profiler-report';
  version: 1;
  /** ISO 8601 UTC (Requirement 7.3). */
  exportedAt: string;
  /** Requirement 7.4's explicit marking, machine-readable. */
  narrativeGenerated: boolean;
  narrative: InsightNarrative | null;
  profile: DataProfile;
}

/**
 * The profile as a JSON document, indented two spaces so a human can read the
 * downloaded file.
 *
 * `profile` is the input profile by reference — `JSON.stringify` does not mutate
 * what it serializes, so no clone is needed and no field is rewritten. Every
 * Requirement 7.3 value is therefore present: `profile.sourceName`,
 * `profile.retainedRowCount`, `profile.totalRowCount`,
 * `profile.duplicateRowCount`, `profile.quality.score`, `profile.columns`,
 * `profile.correlations`, `profile.quality.recommendations`, and `exportedAt`
 * at the top level.
 *
 * Pure: reads `input`, returns a string, mutates nothing.
 */
export function toJsonReport(input: ReportInput): string {
  const document: JsonReportDocument = {
    document: 'csv-data-profiler-report',
    version: 1,
    exportedAt: isoTimestamp(input.exportedAt),
    narrativeGenerated: input.narrative !== null,
    narrative: input.narrative,
    profile: input.profile,
  };

  return JSON.stringify(document, null, 2);
}
