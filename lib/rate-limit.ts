// lib/rate-limit.ts
//
// Feature-agnostic sliding-window rate limiter backed by an Upstash Redis
// sorted set. Lives at the root of `lib/` rather than under `data-profiler/`
// because nothing here knows about profiles — `/api/chat` can adopt it as-is.
//
// Edge-runtime safe: `@upstash/redis` talks REST over `fetch`, and this module
// imports nothing from `node:*`.
//
// _Requirements: 6.10_
//
// --- Why a sorted set and not a counter --------------------------------------
//
// Requirement 6.10 asks for "the time remaining until the next request is
// permitted". A fixed-window `INCR` + `EXPIRE` counter cannot answer that: it
// knows how many requests landed in the current bucket but not *when* any of
// them landed, so the best it can offer is the TTL of the whole bucket — which
// is wrong at both ends (it over-reports right after a bucket rolls, and it
// under-reports for a client that spent its budget early). A sorted set stores
// one member per accepted request scored by its timestamp, so the answer is a
// direct read: the oldest surviving score leaves the window at
// `oldestScore + windowMs`, and that is the moment a slot frees up. It also
// makes the window genuinely rolling rather than bucketed, so a client cannot
// double its allowance by straddling a bucket boundary.
//
// --- Why no circuit breaker (deliberate divergence from session-memory.ts) ---
//
// `session-memory.ts` wraps every Redis call in a 30-second circuit breaker
// because it fails *open*: losing chat history is cosmetic, so once Redis looks
// dead the cheapest correct behaviour is to stop calling it and keep serving.
//
// This module is consumed by a path that fails *closed* — the design has
// `/api/profile-insights` answer 503 when `checkRateLimit` returns `null`,
// because an unmetered path spends model tokens. A breaker in front of a
// fail-closed caller inverts its own purpose: one transient blip would latch
// the feature off for 30 seconds even after Redis recovered, converting a
// self-healing failure into a sticky outage. The per-request cost the breaker
// exists to avoid is also not paid here, since there is exactly one limiter
// call per request and it is already bounded by `OP_TIMEOUT_MS`. So: no
// breaker, by decision rather than by omission.
//
// --- Atomicity: count-then-add is NOT atomic ---------------------------------
//
// The prune/count/oldest reads travel as one pipeline (one round trip, executed
// in order server-side, so `ZCARD` sees the pruned set), and the `ZADD`/`EXPIRE`
// write travels as a second pipeline that is only sent when the request was
// accepted. Two round trips means a gap: N concurrent requests from the same
// key can all observe `count = limit - 1` and all write, so the window may
// briefly hold up to `limit + N - 1` members.
//
// Worst case is therefore a small overshoot under same-key concurrency, after
// which the extra members are counted like any other and the client is denied
// until they age out — the budget is repaid, not forgiven. For a portfolio
// endpoint this is an acceptable trade against the alternatives, and it is a
// stated decision rather than an oversight. If exactness is ever needed, the fix
// is a single `EVAL` Lua script (Upstash supports it) doing prune → count →
// conditional add atomically; the signature below does not change.
//
// --- Why ZADD only on accept -------------------------------------------------
//
// A denied request writes nothing. Recording denials would let a client that
// hammers the endpoint keep pushing its own window forward and never recover
// inside the window — the limiter would punish retries instead of metering
// accepted work. Only accepted requests consume budget.

import { Redis } from '@upstash/redis';

// Module-level env read, matching `session-memory.ts`: construct a client only
// when both variables are present, otherwise stay `null` and let every call
// report unavailability.
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;

/**
 * Hard ceiling on the limiter's own latency. A hung or very slow Redis must not
 * hold an Edge request open; exceeding this is reported as unavailability
 * (`null`) so the caller applies its own fail-open/fail-closed policy promptly.
 */
const OP_TIMEOUT_MS = 1_500;

export interface RateLimitResult {
  /** True when this request is within the window's budget. */
  allowed: boolean;
  /** Budget left after this request. 0 when denied. */
  remaining: number;
  /** Milliseconds until a slot frees up. 0 when allowed, positive when denied. */
  retryAfterMs: number;
}

/**
 * Unique sorted-set member for one accepted request.
 *
 * Members must be distinct: a sorted set treats a repeated member as a score
 * *update*, so two accepted requests landing in the same millisecond would
 * collapse into a single entry and silently hand a client a free request. The
 * timestamp prefix keeps members roughly sorted for readability when inspecting
 * the key by hand; the random suffix is what guarantees distinctness.
 *
 * `Math.random()` is fine here — this module is explicitly impure (network,
 * ambient clock). The no-randomness rule applies to the pure analysis modules
 * under `lib/data-profiler/`, whose determinism the property tests depend on.
 */
function uniqueMember(now: number): string {
  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 12);
  return `${now}-${suffix}`;
}

/** Resolves to `null` if `op` has not settled within `OP_TIMEOUT_MS`. */
async function withTimeout<T>(op: Promise<T>): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  // Swallow a late rejection if the timeout wins the race, so a slow failure
  // cannot surface as an unhandled rejection.
  op.catch(() => {});
  try {
    return await Promise.race([
      op,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), OP_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Checks and records one request against a rolling window.
 *
 * @param key      Caller-namespaced identity, e.g. `profiler:insights:{ip}`.
 *                 Used verbatim as the Redis key.
 * @param limit    Accepted requests permitted per window. `<= 0` denies always.
 * @param windowMs Window length in milliseconds.
 *
 * @returns A `RateLimitResult`, or `null` when the limit could not be
 * determined — the environment variables are absent, or Redis errored, timed
 * out, or returned something unusable.
 *
 * **`null` is not a verdict.** It is deliberately neither a throw nor a
 * permissive result: this module reports what it knows and takes no position on
 * what should happen when it knows nothing. Whether an unmetered request is
 * better than a rejected one depends entirely on what the route spends, so that
 * choice belongs to the route. (`/api/profile-insights` fails closed with 503;
 * a cheaper endpoint could reasonably fail open on the same `null`.)
 *
 * Side effect: on an accepted request only, one member is added to the sorted
 * set and the key's TTL is refreshed. A denied request leaves the set untouched.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult | null> {
  if (!redis) return null;
  if (!Number.isFinite(limit) || !Number.isFinite(windowMs) || windowMs <= 0) return null;

  const now = Date.now();
  // Members scored at or before this instant have left the window.
  const windowStart = now - windowMs;

  try {
    // One round trip: prune expired members, count what survives, and read the
    // oldest survivor's score. Pipelined commands execute in order, so ZCARD and
    // ZRANGE both observe the pruned set.
    const read = redis
      .pipeline()
      .zremrangebyscore(key, 0, windowStart)
      .zcard(key)
      .zrange<(string | number)[]>(key, 0, 0, { withScores: true });

    const results = await withTimeout(read.exec<[number, number, (string | number)[]]>());
    if (results === null) return null;

    const count = typeof results[1] === 'number' ? results[1] : Number(results[1]);
    if (!Number.isFinite(count)) return null;

    if (count >= limit) {
      // `zrange ... withScores` returns a flat [member, score] pair.
      const oldestScore = Number(results[2]?.[1]);
      const retryAfterMs = Number.isFinite(oldestScore)
        ? oldestScore + windowMs - now
        : windowMs;
      return {
        allowed: false,
        remaining: 0,
        // Always positive: the caller reports it as a wait, and a 0 or negative
        // wait alongside `allowed: false` would read as "retry now", which is
        // exactly what a denied client must not do. A score can round to the
        // current instant, hence the clamp.
        retryAfterMs: Math.max(1, Math.ceil(retryAfterMs)),
      };
    }

    // Accepted. Record it and bound the key's lifetime so an idle client's set
    // is reclaimed instead of lingering forever. One extra second of TTL covers
    // the rounding down of a sub-second window.
    const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000) + 1);
    const write = redis
      .pipeline()
      .zadd(key, { score: now, member: uniqueMember(now) })
      .expire(key, ttlSeconds);

    const written = await withTimeout(write.exec<[number | null, 0 | 1]>());
    // A failed write means the request was not recorded, so reporting it as
    // accepted would leak an unmetered call. Report unavailability instead and
    // let the caller decide.
    if (written === null) return null;

    return { allowed: true, remaining: Math.max(0, limit - count - 1), retryAfterMs: 0 };
  } catch {
    // Never throws and never leaks the Redis error: the caller cannot act on it
    // and the route must not surface internals (security.md §7).
    return null;
  }
}
