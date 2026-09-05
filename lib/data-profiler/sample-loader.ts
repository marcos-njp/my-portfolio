// lib/data-profiler/sample-loader.ts
//
// The only place in this feature that fetches a bundled Sample_Dataset.
//
// **Why this module exists.** The project rule is that no component issues a
// bare `fetch` (design.md: "Sample CSV loading is wrapped in
// `lib/data-profiler/sample-loader.ts`. No component calls `fetch` directly.").
// The Select control in task 13.2 hands an `id` to the state machine in task
// 12.1, which calls `loadSampleDataset` and passes the returned text straight
// to `parseCsvText`. The network detail, the URL construction and the failure
// vocabulary all live here.
//
// **This `fetch` does not weaken Requirement 1.13.** Requirement 1.13 says the
// Profiler_UI transmits zero data rows and zero file contents to any server
// endpoint. The request below is a same-origin HTTP GET for a static asset that
// ships inside the deployment (`public/samples/<filename>` → `/samples/...`).
// It carries no body, no query string, no visitor data and no header derived
// from anything the visitor supplied — it is a *download* of an application
// asset, the same class of request as loading a stylesheet. Data flows inward
// only. Anyone auditing the no-transmission guarantee will grep every `fetch`
// in this feature; this is the one that is fine, and that is why.
//
// Impure (network + ambient `fetch`), but a thin adapter: it validates the id,
// issues one GET, and maps the result into a discriminated union. No parsing,
// no state, no retries.
//
// _Requirements: 1.1, 1.2, 1.13_

import {
  findProfilerSample,
  SAMPLES_BASE_PATH,
  type ProfilerSample,
} from '@/data/profiler-samples';

/**
 * Why the sample failed to load.
 *
 * - `unknown-id` — the id is not in `PROFILER_SAMPLES`. No request was made.
 * - `http` — the server answered, but not with 2xx. `status` is carried so the
 *   UI can distinguish "the file is missing from this deployment" (404) from a
 *   server-side problem, which are different things for a visitor to read.
 * - `network` — the request never produced a response (offline, DNS, CORS,
 *   connection reset). `fetch` rejects for these and gives no status.
 * - `aborted` — the caller's `AbortSignal` fired. Requirement 8.7 has the
 *   caller discard a reset-during-load result rather than display it, so this
 *   member exists to be recognised and dropped, not to be rendered.
 */
export type SampleLoadFailure =
  | { kind: 'unknown-id'; id: string }
  | { kind: 'http'; status: number; url: string }
  | { kind: 'network'; url: string }
  | { kind: 'aborted' };

/**
 * The result of a load attempt.
 *
 * **Why a discriminated union rather than a `Promise<string>` that throws.**
 * Every other fallible boundary in this feature already reports failure as
 * data: `csv-parse.ts` returns `ParseOutcome` with a `ParseRejection` union,
 * and `lib/query-validator.ts` carries a closed `errorType` field that the
 * design cites as the precedent for enumerated, mappable failures. Task 12.1's
 * state machine has to turn a failure into one displayed message, and a union
 * makes that a total `switch` the compiler checks — a thrown `Error` would make
 * it string-sniffing on a message, and would need a `try/catch` at a call site
 * that is already juggling an `AbortController` and a monotonic run id. The
 * union also keeps `aborted` expressible as an ordinary, ignorable value
 * instead of an exception that has to be filtered by name.
 *
 * `sample` is returned alongside the text so the caller does not have to look
 * the entry up a second time to get `label` (used as the dataset source name)
 * or `rowCount`.
 */
export type SampleLoadOutcome =
  | { ok: true; sample: ProfilerSample; csvText: string }
  | { ok: false; failure: SampleLoadFailure };

/**
 * `signal.aborted` is a live value that flips while a request is in flight, so
 * it is read through a function rather than inspected inline: an inline
 * `signal?.aborted` check gets narrowed to `false` by control flow analysis
 * after the pre-flight check, and every later read would be flagged as dead.
 */
function isAborted(signal: AbortSignal | undefined): boolean {
  return signal !== undefined && signal.aborted;
}

/** Builds the public URL for an entry. Only ever called with a validated entry. */
export function sampleUrl(sample: ProfilerSample): string {
  return `${SAMPLES_BASE_PATH}/${sample.filename}`;
}

/**
 * Loads the CSV text of a bundled Sample_Dataset (Requirements 1.1, 1.2).
 *
 * **The id is resolved against the index before any URL is built.** `id`
 * arrives from UI state, and interpolating an unvalidated value into a URL path
 * is exactly how a path-traversal or arbitrary-fetch bug gets in — an id of
 * `../../api/something` or an absolute URL would otherwise become a real
 * request. `findProfilerSample` is an allow-list lookup: an id that is not one
 * of the three known entries fails with `unknown-id` and **no request is
 * issued**. The filename that reaches the URL is therefore always a literal
 * from `data/profiler-samples.ts`, never caller input.
 *
 * The response is fetched with `cache: 'force-cache'`. These files are
 * immutable within a deployment (a new deployment serves new asset URLs and a
 * fresh cache), so re-selecting a sample should come from the HTTP cache rather
 * than the network — that is what keeps the 1-second budget in Requirement 1.2
 * comfortable on a slow connection. This is the browser's own HTTP cache; it
 * does not conflict with the design's session rule that no *application* state
 * survives a reload, since the bytes served are identical either way.
 *
 * @param id The `ProfilerSample.id` chosen in the Select.
 * @param signal Optional. Aborting cancels the in-flight GET and resolves with
 * `{ kind: 'aborted' }` so a reset during load discards cleanly
 * (Requirement 8.7). This widens the design's `loadSampleDataset(id)` signature
 * with an optional second parameter; existing single-argument calls are
 * unaffected.
 */
export async function loadSampleDataset(
  id: string,
  signal?: AbortSignal,
): Promise<SampleLoadOutcome> {
  const sample = findProfilerSample(id);
  if (sample === undefined) {
    return { ok: false, failure: { kind: 'unknown-id', id } };
  }

  const url = sampleUrl(sample);

  // Checked before the request so an already-cancelled load costs nothing.
  if (isAborted(signal)) {
    return { ok: false, failure: { kind: 'aborted' } };
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      cache: 'force-cache',
      // Same-origin static asset: no credentials are needed and none are sent.
      credentials: 'omit',
      signal,
    });
  } catch {
    // `fetch` rejects both for an abort and for a transport failure, and only
    // the signal tells the two apart reliably (`AbortError` naming differs
    // across runtimes). Checking the signal first keeps a cancelled load out of
    // the error path the UI reports on.
    if (isAborted(signal)) return { ok: false, failure: { kind: 'aborted' } };
    return { ok: false, failure: { kind: 'network', url } };
  }

  if (!response.ok) {
    return { ok: false, failure: { kind: 'http', status: response.status, url } };
  }

  try {
    const csvText = await response.text();
    return { ok: true, sample, csvText };
  } catch {
    // The body can still fail mid-stream after a 200. That is a transport
    // failure, not an HTTP status failure, so it reports as `network`.
    if (isAborted(signal)) return { ok: false, failure: { kind: 'aborted' } };
    return { ok: false, failure: { kind: 'network', url } };
  }
}
