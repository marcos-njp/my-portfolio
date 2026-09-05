// lib/data-profiler/insight-client.ts
//
// The single client→server call in this feature: `POST /api/profile-insights`.
//
// **Why this module exists.** `docs/agents.md` rule 11 forbids a bare `fetch` in
// a component, and design.md pins the wrapper here: "The single client→server
// call is wrapped in `lib/data-profiler/insight-client.ts`." Every network
// detail — the URL, the timeout, the status mapping, the response validation —
// lives in this file so the state machine in task 12.1 only ever sees an
// outcome value.
//
// Impure (network, ambient `fetch`, a timer) but a thin adapter: it issues one
// request and maps the result into a discriminated union. No retries, no state,
// no caching.
//
// _Requirements: 6.1, 6.11, 6.13_

import { INSIGHT_TIMEOUT_MS } from './constants';
import {
  insightNarrativeSchema,
  type InsightNarrative,
  type InsightPayload,
} from './insight-schema';

/** The one endpoint. Same-origin, relative, so it works in every environment. */
export const INSIGHT_ENDPOINT = '/api/profile-insights';

/**
 * Why the insight request failed.
 *
 * **Why a discriminated union rather than a throwing promise.** Every fallible
 * boundary in this feature already reports failure as data:
 * `sample-loader.ts` returns `SampleLoadOutcome` with a `SampleLoadFailure`
 * union, `csv-parse.ts` returns `ParseOutcome` with a `ParseRejection` union, and
 * `lib/query-validator.ts` carries a closed `errorType` that design.md cites as
 * the precedent for enumerated, mappable failures. Task 12.1 has to turn a
 * failure into exactly one displayed message; a union makes that an exhaustive
 * `switch` the compiler checks, where a thrown `Error` would make it
 * string-sniffing on `error.message`. It also lets `aborted` be an ordinary
 * ignorable value instead of an exception that has to be filtered by name.
 *
 * The members:
 *
 * - `http` — the server answered with a non-200. `message` is the server's own
 *   `message` field, which Requirement 6.11 requires the UI to display, and
 *   `status` is carried so the caller can still distinguish a 400 (a payload bug
 *   worth logging) from a 502 or 503 (a transient service problem).
 * - `rate-limit` — a 429, split out from `http` because Requirement 6.10 has the
 *   server report the limit and the time remaining, and the UI may want to treat
 *   that differently from a generic error (disable the control, show a countdown)
 *   rather than just printing a sentence. `retryAfterMs` is the `Retry-After`
 *   header when the server sent one, `null` otherwise; the human-readable timing
 *   is already inside `message`.
 * - `invalid-response` — a 200 whose body did not satisfy
 *   `insightNarrativeSchema`. Distinct from `http` because nothing is wrong with
 *   the transport: the shape is wrong, and there is no server message to show.
 * - `timeout` — our own 30-second watchdog fired (Requirement 6.13).
 * - `aborted` — the *caller's* signal fired (reset, unmount, a second dataset
 *   loaded). Requirement 6.11 keeps prior results on screen, so this outcome
 *   exists to be recognised and **discarded**, never displayed.
 * - `network` — the request produced no response at all: offline, DNS, connection
 *   reset, CORS. `fetch` rejects for these and gives no status.
 */
export type InsightFailure =
  | { kind: 'http'; status: number; message: string }
  | { kind: 'rate-limit'; status: 429; message: string; retryAfterMs: number | null }
  | { kind: 'invalid-response'; status: number }
  | { kind: 'timeout'; timeoutMs: number }
  | { kind: 'aborted' }
  | { kind: 'network' };

/** The result of one insight request. */
export type InsightOutcome =
  | { ok: true; narrative: InsightNarrative }
  | { ok: false; failure: InsightFailure };

/**
 * Fallback text for a non-200 whose body carried no usable `message`.
 *
 * Requirement 6.11 says the UI displays "the returned message", which presumes
 * one came back. A proxy error page, a gateway timeout page or a truncated
 * response has no JSON body at all, and the UI still has to say something, so a
 * status-shaped sentence is synthesised. Deliberately vague about internals —
 * the visitor gets a state, not a stack.
 */
function fallbackMessage(status: number): string {
  if (status === 429) {
    return 'The insight request limit has been reached. Please try again later.';
  }
  if (status === 400) {
    return 'The insight request was rejected as invalid.';
  }
  if (status === 503) {
    return 'The insight service is temporarily unavailable. Please try again shortly.';
  }
  if (status >= 500) {
    return 'The insight service could not generate a narrative. Please try again.';
  }
  return `The insight request failed (HTTP ${status}).`;
}

/**
 * Reads the response body as JSON without ever throwing.
 *
 * This is not defensive padding. A same-origin `POST` can be answered by
 * something that is not our route: a CDN or reverse-proxy error page (HTML), a
 * 413 from an upstream body-size limit, a 504 gateway page, or a connection that
 * drops mid-body. `response.json()` rejects for all of those, and letting that
 * rejection escape would surface a 502 to the visitor as an unhandled promise
 * rejection instead of the message Requirement 6.11 asks for.
 */
async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/** The server's `message` field, if the body is an object carrying a string one. */
function extractMessage(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null;
  const message = (body as { message?: unknown }).message;
  return typeof message === 'string' && message.trim() !== '' ? message : null;
}

/**
 * How long until another request is permitted, in milliseconds.
 *
 * The route sends the value twice: as `retryAfterMs` in the JSON body (whole
 * milliseconds, straight from the sliding window) and as a `Retry-After` header
 * (whole seconds, because that is what the header allows). The body is preferred
 * for its resolution; the header is the fallback for a 429 that came from
 * somewhere else, such as an upstream proxy or edge limiter that never reached
 * our handler. `Retry-After` may also hold an HTTP date, which is not read —
 * anything non-numeric yields `null`, and the human-readable timing is already
 * inside `message` either way.
 */
function retryAfterMs(response: Response, body: unknown): number | null {
  if (typeof body === 'object' && body !== null) {
    const fromBody = (body as { retryAfterMs?: unknown }).retryAfterMs;
    if (typeof fromBody === 'number' && Number.isFinite(fromBody) && fromBody >= 0) {
      return Math.round(fromBody);
    }
  }

  const raw = response.headers?.get?.('Retry-After');
  if (raw === null || raw === undefined || raw.trim() === '') return null;
  const seconds = Number(raw);
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  return Math.round(seconds * 1000);
}

/**
 * The route answers `200 { narrative }` (task 9.5). The narrative is pulled out
 * of that envelope, but a body that *is* the narrative is also accepted, so this
 * client does not break if the envelope is ever flattened. Either way the value
 * goes through `insightNarrativeSchema` before it is returned.
 */
function unwrapNarrative(body: unknown): unknown {
  if (typeof body === 'object' && body !== null && 'narrative' in body) {
    return (body as { narrative: unknown }).narrative;
  }
  return body;
}

/**
 * `signal.aborted` is a live value that flips while the request is in flight, so
 * it is read through a function: an inline check gets narrowed to `false` by
 * control-flow analysis after the pre-flight guard, and later reads would be
 * flagged as dead code.
 */
function isAborted(signal: AbortSignal | undefined): boolean {
  return signal !== undefined && signal.aborted;
}

/**
 * Requests an Insight_Narrative for an already-built Insight_Payload.
 *
 * **The body is exactly `JSON.stringify(payload)`.** No wrapper object, no
 * client-added field, no metadata. `insightPayloadSchema.strict()` on the server
 * rejects any unknown key anywhere in the tree, so a single extra field here
 * would 400 every request — but the stronger reason is Requirement 6.2's
 * exhaustive allow-list: the payload the profiler built is the entire contract,
 * and this function is a courier, not a co-author.
 *
 * **Timeout composition (Requirement 6.13).** An internal `AbortController` is
 * armed with `INSIGHT_TIMEOUT_MS` and the caller's `signal`, if any, is relayed
 * onto it. Both can therefore abort the same request, which is the whole point:
 * the watchdog must fire even when the caller passed no signal, and a reset must
 * cancel even before the watchdog is due.
 *
 * `AbortSignal.any([...])` would express this in one line, but it is not
 * available in every runtime this code has to run in (it is absent in older
 * Safari and in Node 18, which is still a supported test environment), and
 * feature-detecting it would mean maintaining the manual relay as a fallback
 * anyway. So the relay is the only path — one listener, removed in `finally`.
 *
 * Which of the two aborts happened is tracked in a local `timedOut` flag rather
 * than inferred from the rejection: an abort surfaces as a `DOMException` whose
 * `name` is not consistent across runtimes, and the caller's abort and ours are
 * indistinguishable once they reach `fetch`. The caller's signal is checked
 * first when both fired, because a caller-initiated abort means the result is
 * being discarded regardless.
 *
 * @param payload The payload from `buildInsightPayload`, sent verbatim.
 * @param signal Optional. Aborting resolves with `{ kind: 'aborted' }` so the
 * caller's `await` always completes and the result can simply be dropped.
 */
export async function requestInsights(
  payload: InsightPayload,
  signal?: AbortSignal,
): Promise<InsightOutcome> {
  // An already-cancelled request costs nothing and hits no network.
  if (isAborted(signal)) {
    return { ok: false, failure: { kind: 'aborted' } };
  }

  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, INSIGHT_TIMEOUT_MS);

  const relayAbort = () => controller.abort();
  signal?.addEventListener('abort', relayAbort);

  try {
    let response: Response;
    try {
      response = await fetch(INSIGHT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Requirement 6.2: the payload, and nothing but the payload.
        body: JSON.stringify(payload),
        credentials: 'omit',
        signal: controller.signal,
      });
    } catch {
      // `fetch` rejects for an abort and for a transport failure alike, so the
      // two flags decide which it was before anything is reported as network.
      if (isAborted(signal)) return { ok: false, failure: { kind: 'aborted' } };
      if (timedOut) {
        return { ok: false, failure: { kind: 'timeout', timeoutMs: INSIGHT_TIMEOUT_MS } };
      }
      return { ok: false, failure: { kind: 'network' } };
    }

    const status = response.status;

    if (!response.ok) {
      // Requirement 6.11: surface the server's own message so the UI can show
      // it. Read before any status branching, because 429 needs it too.
      const body = await readJson(response);
      const message = extractMessage(body) ?? fallbackMessage(status);

      if (status === 429) {
        return {
          ok: false,
          failure: {
            kind: 'rate-limit',
            status: 429,
            message,
            retryAfterMs: retryAfterMs(response, body),
          },
        };
      }

      return { ok: false, failure: { kind: 'http', status, message } };
    }

    const body = await readJson(response);

    // Client-side validation of a 200 body. The route already validates the
    // model result (Requirement 6.8), so this is not the primary gate — it is
    // there because the response the browser receives is not necessarily the
    // response the route sent (a proxy, a cached error page, a future change to
    // the envelope), and the UI must not render an unvalidated shape.
    const parsed = insightNarrativeSchema.safeParse(unwrapNarrative(body));
    if (!parsed.success) {
      return { ok: false, failure: { kind: 'invalid-response', status } };
    }

    return { ok: true, narrative: parsed.data };
  } catch {
    // A body that fails mid-stream after a 200, or any other unexpected
    // rejection. Classified the same way as a failed request: an abort or a
    // timeout first, transport failure otherwise. Reaching here must not throw,
    // since the caller has no `try/catch`.
    if (isAborted(signal)) return { ok: false, failure: { kind: 'aborted' } };
    if (timedOut) {
      return { ok: false, failure: { kind: 'timeout', timeoutMs: INSIGHT_TIMEOUT_MS } };
    }
    return { ok: false, failure: { kind: 'network' } };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', relayAbort);
  }
}
