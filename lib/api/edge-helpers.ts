// lib/api/edge-helpers.ts
//
// The response and request helpers shared by the profiler's two edge routes,
// `/api/profile-insights` and `/api/profile-qa`.
//
// They were written for the insights route and moved here when the Q&A route
// needed the same four. Copying them would have meant two rate-limit key
// derivations and two error-shape conventions drifting apart one fix at a time,
// which is precisely the failure the "no duplicate" rule exists to prevent.
//
// Nothing here makes a policy decision. Whether an undetermined rate limit fails
// open or closed, what the budget is, and which errors map to which status all
// stay in the route that owns them.

import type { ZodIssue } from 'zod';

/** A JSON response with the content type already set. */
export function json(
  body: unknown,
  status: number,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

/**
 * Client identity for the limiter: the first `x-forwarded-for` hop, which on
 * Vercel is the address the edge saw.
 *
 * `x-forwarded-for` IS SPOOFABLE. Anyone can send a different value on each
 * request and get a fresh budget, and a shared NAT or corporate proxy
 * conversely puts unrelated visitors in one bucket. Both are accepted: this
 * limiter is abuse resistance for a public portfolio page - it stops a loop or a
 * curious visitor from burning the token budget - and it is NOT a security
 * control. Nothing downstream trusts this value for anything but a Redis key,
 * and there is no authorization decision hanging off it. If either endpoint ever
 * guards something that matters, the fix is authentication, not a cleverer way
 * of reading a header a client controls.
 */
export function clientKeyFrom(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const firstHop = forwarded?.split(',')[0]?.trim();
  return firstHop && firstHop.length > 0 ? firstHop : 'unknown';
}

/** Human wait for a 429 message. Both routes state a time remaining. */
export function formatWait(retryAfterMs: number): string {
  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

/**
 * Renders a zod issue path as `columns[0].name`, plus the offending key names
 * for an `unrecognized_keys` issue (whose path points at the *containing*
 * object, so the path alone would not say what was rejected).
 *
 * A schema path is safe to return: it names the wire contract the client
 * already has, not server internals (security.md section 7). No zod message, no
 * stack, and nothing echoed back from the request value.
 */
export function describeIssue(issue: ZodIssue | undefined): string {
  if (!issue) return 'payload';

  const path = issue.path.reduce<string>((acc, segment) => {
    if (typeof segment === 'number') return `${acc}[${segment}]`;
    return acc.length === 0 ? String(segment) : `${acc}.${String(segment)}`;
  }, '');

  const location = path.length > 0 ? path : 'payload';

  if (issue.code === 'unrecognized_keys') {
    const keys = issue.keys.join(', ');
    return `${location} (unrecognized field: ${keys})`;
  }

  return location;
}
