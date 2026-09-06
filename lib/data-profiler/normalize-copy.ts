// lib/data-profiler/normalize-copy.ts
//
// Folds typographic characters out of MODEL-GENERATED text before it is
// rendered.
//
// The site's copy rule is ASCII punctuation, and `copy-glyphs.test.ts` enforces
// it across every string this repo writes. Model output is the one channel that
// test cannot reach: it is produced at request time, not committed. Both prompts
// ask for plain punctuation, and both models ignore that request often enough to
// matter. One observed reply contained a non-breaking hyphen in "inter-quartile"
// and an approximately-equal sign before a coefficient.
//
// A prompt is a request. This is a guarantee: it runs on the way to the screen,
// so the rule holds whatever the model decides to emit.
//
// --- Why the table is written as code points ---------------------------------
//
// This module is about the forbidden characters, so writing them out would trip
// the very guard it exists to uphold, in either spelling: `copy-glyphs.test.ts`
// scans `lib/data-profiler` for both the raw character and its `\u` escape.
// Building the patterns from `String.fromCharCode` keeps the file compliant with
// no exemption, and a table of named code points is easier to audit against the
// guard's own list than a row of glyphs that render almost identically.
//
// Deliberately NOT a general sanitizer. It touches punctuation only, never
// letters or digits, so a column name with an accented character or a non-Latin
// script passes through untouched. Escaping stays React's job, and React already
// does it: every one of these strings is rendered as a JSX child.

/** One substitution: the code points to replace, and what to put in their place. */
interface Substitution {
  /** For the reader. Not used at runtime. */
  readonly name: string;
  readonly codes: readonly number[];
  readonly to: string;
}

const SUBSTITUTIONS: readonly Substitution[] = [
  { name: 'dashes', codes: [0x2012, 0x2013, 0x2014, 0x2015, 0x2011, 0x2212], to: '-' },
  { name: 'ellipsis', codes: [0x2026], to: '...' },
  { name: 'single quotes', codes: [0x2018, 0x2019, 0x201b, 0x2032], to: "'" },
  { name: 'double quotes', codes: [0x201c, 0x201d, 0x201f, 0x2033], to: '"' },
  { name: 'middot', codes: [0x00b7], to: ',' },
  { name: 'bullet', codes: [0x2022], to: '-' },
  { name: 'approximately equal', codes: [0x2248], to: 'about ' },
  { name: 'not equal', codes: [0x2260], to: 'not equal to ' },
  { name: 'less than or equal', codes: [0x2264], to: '<=' },
  { name: 'greater than or equal', codes: [0x2265], to: '>=' },
  { name: 'rightwards arrow', codes: [0x2192], to: ' to ' },
  { name: 'leftwards arrow', codes: [0x2190], to: ' from ' },
  { name: 'exotic spaces', codes: [0x00a0, 0x2009, 0x202f, 0x2007, 0x2002, 0x2003], to: ' ' },
  { name: 'zero width', codes: [0x200b, 0x200c, 0x200d, 0x2060, 0xfeff], to: '' },
];

/** Compiled once at module load, not per call. */
const COMPILED: ReadonlyArray<readonly [RegExp, string]> = SUBSTITUTIONS.map((entry) => [
  new RegExp(`[${entry.codes.map((code) => String.fromCharCode(code)).join('')}]`, 'g'),
  entry.to,
]);

/** Collapses the runs of spaces a substitution can leave behind. */
const DOUBLE_SPACE = / {2,}/g;

/**
 * Returns `text` with every typographic character replaced by its ASCII form.
 *
 * Safe to call on a partial string. The answer path calls it on each streamed
 * chunk as it accumulates, and every substitution is single-character, so no
 * replacement can straddle a chunk boundary and be missed.
 */
export function normalizeCopy(text: string): string {
  let out = text;
  for (const [pattern, replacement] of COMPILED) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(DOUBLE_SPACE, ' ');
}
