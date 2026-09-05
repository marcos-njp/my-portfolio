// lib/data-profiler/values.ts
//
// Value classification primitives. Pure module: no side effects, no ambient
// clock, no randomness. Every export is total — invalid input yields `null`
// or `false`, never a throw.
//
// Requirements: 2.2, 2.3, 2.11, 3.5

/** A raw CSV cell. Ragged rows can leave trailing cells absent. */
export type RawCell = string | null | undefined;

/**
 * True when a cell carries no value: absent, `null`, empty, or whitespace-only.
 *
 * Nullish cells are excluded from both the non-null count and the distinct
 * count (Requirement 2.11).
 */
export function isNullish(v: RawCell): boolean {
  return v === undefined || v === null || v.trim() === '';
}

/**
 * Parses a cell as a finite number, or returns `null`.
 *
 * Rejects `NaN`, `Infinity`, `-Infinity`, and the empty/whitespace-only string.
 * The nullish check runs *before* `Number()` because `Number('')` is `0`
 * (Requirement 2.2).
 */
export function parseFiniteNumber(v: RawCell): number | null {
  if (isNullish(v)) return null;
  const n = Number((v as string).trim());
  return Number.isFinite(n) ? n : null;
}

// --- Date parsing ------------------------------------------------------------

/**
 * ISO 8601: a calendar date, optionally followed by a time and an optional
 * `Z`/±HH:MM offset. `T` or a single space separates date from time.
 */
const ISO_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?\s*(Z|z|[+-]\d{2}:?\d{2})?)?$/;

/** `MM/DD/YYYY` and `DD/MM/YYYY` share this shape; the fields are read by position. */
const SLASH_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * `Date.UTC` maps years 0–99 onto 1900–1999, so those are corrected explicitly.
 * Kept separate so both the ISO and slash paths share one epoch conversion.
 */
function utcMs(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
): number {
  const ms = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  if (year >= 100) return ms;
  const d = new Date(ms);
  d.setUTCFullYear(year);
  return d.getTime();
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Component-wise range check. February 29 is accepted only in leap years. */
function isValidYmd(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || year < 1 || year > 9999) return false;
  if (!Number.isInteger(month) || month < 1 || month > 12) return false;
  if (!Number.isInteger(day) || day < 1) return false;
  const max = month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1];
  return day <= max;
}

/** Offset in minutes to subtract from the wall-clock reading, or `null` if malformed. */
function offsetMinutes(raw: string | undefined): number | null {
  if (raw === undefined) return 0; // no designator: interpreted as UTC
  if (raw === 'Z' || raw === 'z') return 0;
  const sign = raw[0] === '-' ? -1 : 1;
  const digits = raw.slice(1).replace(':', '');
  const hours = Number(digits.slice(0, 2));
  const minutes = Number(digits.slice(2, 4));
  if (!Number.isInteger(hours) || hours > 23) return null;
  if (!Number.isInteger(minutes) || minutes > 59) return null;
  return sign * (hours * 60 + minutes);
}

function parseIso(v: string): number | null {
  const m = ISO_PATTERN.exec(v);
  if (m === null) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!isValidYmd(year, month, day)) return null;

  // Date-only form.
  if (m[4] === undefined) return utcMs(year, month, day);

  const hour = Number(m[4]);
  const minute = Number(m[5]);
  const second = m[6] === undefined ? 0 : Number(m[6]);
  const fraction = m[7] === undefined ? 0 : Number(`0.${m[7]}`);
  if (hour > 23 || minute > 59 || second > 59) return null;

  const offset = offsetMinutes(m[8]);
  if (offset === null) return null;

  const ms = utcMs(
    year,
    month,
    day,
    hour,
    minute,
    second,
    Math.round(fraction * 1000),
  );
  return ms - offset * 60_000;
}

/** Reads a slash-delimited date with the month at `monthFirst ? 1 : 2`. */
function parseSlash(v: string, monthFirst: boolean): number | null {
  const m = SLASH_PATTERN.exec(v);
  if (m === null) return null;

  const month = Number(monthFirst ? m[1] : m[2]);
  const day = Number(monthFirst ? m[2] : m[1]);
  const year = Number(m[3]);
  if (!isValidYmd(year, month, day)) return null;

  return utcMs(year, month, day);
}

/**
 * Parses a cell as one of the four accepted date formats, returning a UTC
 * epoch millisecond value, or `null` when none match.
 *
 * Attempts are ordered: ISO 8601 (which subsumes bare `YYYY-MM-DD`),
 * `MM/DD/YYYY`, then `DD/MM/YYYY`. Because month-first is tried first, the
 * ambiguous `03/04/2024` resolves to March 4 (Requirement 2.3).
 *
 * Slash formats are matched by explicit regex and range-checked
 * component-wise; nothing is ever handed to `new Date()`, whose fallback
 * parsing is implementation-defined. Invalid calendar days such as
 * `2024-02-30` are rejected rather than rolled over.
 */
export function parseAcceptedDate(v: RawCell): number | null {
  if (isNullish(v)) return null;
  const s = (v as string).trim();

  const iso = parseIso(s);
  if (iso !== null) return iso;

  const monthFirst = parseSlash(s, true);
  if (monthFirst !== null) return monthFirst;

  return parseSlash(s, false);
}
