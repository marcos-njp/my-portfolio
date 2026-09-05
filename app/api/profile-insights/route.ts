// app/api/profile-insights/route.ts
//
// The Insight_Service: the ONE server boundary the CSV Data Profiler has.
// Everything else in the feature runs in the browser and transmits nothing
// (Requirements 1.13, 7.5). This route accepts derived aggregates only, turns
// them into a structured narrative, and returns it.
//
// _Requirements: 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_
//
// Structure deliberately mirrors `app/api/chat/route.ts`: `runtime = 'edge'`,
// `dynamic = 'force-dynamic'`, a lazy singleton Groq client behind an env guard
// that throws, guard-first handler body, and `{ error, message }` JSON bodies on
// every non-200. Divergences from that route are called out where they occur.
//
// --- SECURITY POSTURE (read this before changing anything below) -------------
//
// This is a PUBLIC, UNAUTHENTICATED POST endpoint that spends model tokens. Its
// only abuse control is a 10-request-per-hour-per-IP limiter. That is a
// deliberate choice for a portfolio page — there are no accounts to
// authenticate against — but it should be understood as such rather than
// mistaken for a hardened API.
//
// What IS structurally guaranteed here, and is the actual point of the feature:
// prompt injection is impossible by construction, not by filtering. The model
// receives exactly two things (Requirement 6.7) — a server-defined instruction
// constant that never leaves this file, and the object that came out of
// `insightPayloadSchema.strict().safeParse()`. The payload schema has no
// free-text field anywhere in its tree and is `.strict()` at every depth, so
// there is no field a caller can put prose into and no extra field they can bolt
// on. See the long comment in `lib/data-profiler/insight-schema.ts`.
//
// --- Why `lib/query-validator.ts` is NOT applied here ------------------------
//
// `docs/agents.md` mandates query validation before RAG on the chat route, and
// design.md scopes that rule out of this one explicitly:
//
//   "`docs/agents.md` rule 6 ... and rule 4 ('validate queries before RAG')
//    apply to the digital-twin chat persona. They do NOT apply to
//    `/api/profile-insights`, which has no persona, no visitor text, and no RAG
//    retrieval. Applying `query-validator.ts` here would be meaningless — there
//    is no query to validate. This is a deliberate scoping decision, not an
//    oversight."
//
// `validateQuery()` takes a visitor-authored string and judges its length,
// topicality and injection markers. This route never receives such a string:
// the request body is a tree of numbers, enums and already-truncated aggregate
// labels. There is nothing to hand it. The schema *is* the validation layer on
// this path, and it is a strictly stronger one — an allow-list of shapes rather
// than a deny-list of patterns.

import { createGroq } from '@ai-sdk/groq';
import { generateObject } from 'ai';
import type { ZodIssue } from 'zod';
import { insightNarrativeSchema, insightPayloadSchema } from '@/lib/data-profiler/insight-schema';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/** Groq, per `agents.md`. Same model the chat route uses. */
const MODEL_ID = 'openai/gpt-oss-120b';

/** Requirement 6.10: 10 accepted requests per rolling 60-minute window. */
const INSIGHT_REQUEST_LIMIT = 10;
const INSIGHT_WINDOW_MS = 60 * 60 * 1000;

/**
 * Checked inside the handler, never at module scope, so a secret is only ever
 * read on a request path (security.md §4). Names live here; values do not.
 */
const REQUIRED_ENV = [
  'GROQ_API_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
] as const;

// --- The prompt --------------------------------------------------------------
//
// Module-level `const`, defined on the server, never interpolated with anything
// from the request. This is one of the exactly two inputs Requirement 6.7
// permits.
//
// It is written to be read by the model, not by a human: dense, imperative, no
// preamble. The paragraph about derived statistics is load-bearing — without it
// the model writes "looking at the rows I can see…" and invents record-level
// detail it was never given, which would misrepresent the whole architecture
// this feature exists to demonstrate.

const INSIGHT_INSTRUCTION = `You are a senior data analyst writing the interpretation section of a dataset profile report. Your reader is another analyst deciding whether this dataset is fit to work with and what to do next.

YOUR INPUT IS DERIVED STATISTICS ONLY. You receive per-column aggregates (counts, min, max, mean, median, standard deviation, quartiles, outlier counts, top value frequencies, date ranges), correlation coefficients, a quality score and cleaning recommendations. You have NOT seen a single data row. Never write as if you had: no claims about individual records, no invented example values, no guesses at what any specific row contains. Reason only from the numbers given.

Cover, in the summary and observations:
- DATA QUALITY FIRST. Null counts as a share of rows, duplicate rows, columns typed 'unknown', and outlier counts. Name the affected columns. Say what each issue blocks or biases.
- DISTRIBUTION SHAPE. Compare mean to median to infer skew and direction. Read the spread from standard deviation and the quartile gaps. Flag a standard deviation near zero as a near-constant column, and a distinct count equal to the non-null count as an identifier rather than a measure.
- CORRELATIONS AS ASSOCIATION, NEVER CAUSE. Report strength and sign. Never state or imply that one column causes another. Where a strong pair looks like it could be an artifact — a derived column, a unit restatement, a shared driver — say so as a possibility to check.
- WHAT THE PROFILE CANNOT TELL YOU. If a column's type or statistics make its meaning ambiguous, say the ambiguity out loud instead of resolving it by assumption.

Then give concrete next analyses. Each one names the actual columns involved and the specific check to run — a segmentation, a group comparison, a time trend, a residual inspection, a missingness pattern test. No generic advice like "explore the data" or "consider visualizing"; if it would apply to any dataset, it does not belong here.

STYLE. Plain declarative sentences. Quantify with the numbers you were given. No hedging filler, no restating the schema back, no bullet markers or headings inside any field. Each observation makes one distinct point; do not repeat the summary.`;

// --- Lazy singleton client, matching `/api/chat` ------------------------------

let groqClient: ReturnType<typeof createGroq> | null = null;

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is missing');
  }

  if (!groqClient) {
    groqClient = createGroq({ apiKey: process.env.GROQ_API_KEY });
  }

  return groqClient;
}

// --- Response helpers --------------------------------------------------------

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
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
 * request and get a fresh 10-request budget, and a shared NAT or corporate
 * proxy conversely puts unrelated visitors in one bucket. Both are accepted
 * here: this limiter is abuse resistance for a public portfolio page — it stops
 * a loop or a curious visitor from burning the token budget — and it is NOT a
 * security control. Nothing downstream trusts this value for anything but a
 * Redis key, and there is no authorization decision hanging off it. If this
 * endpoint ever guards something that matters, the fix is authentication, not a
 * cleverer way of reading a header a client controls.
 */
function clientKeyFrom(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const firstHop = forwarded?.split(',')[0]?.trim();
  return firstHop && firstHop.length > 0 ? firstHop : 'unknown';
}

/** Human wait for the 429 message. Requirement 6.10 wants a time remaining. */
function formatWait(retryAfterMs: number): string {
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
 * already has, not server internals (security.md §7). No zod message, no stack,
 * and nothing echoed back from the request value.
 */
function describeIssue(issue: ZodIssue | undefined): string {
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

// --- Handler -----------------------------------------------------------------
//
// POST only. No GET/PUT/DELETE export, so Next answers 405 for other methods
// without any code here.

export async function POST(req: Request): Promise<Response> {
  // ---- 1. Env guard ---------------------------------------------------------
  //
  // The response message is GENERIC on purpose. Naming the absent variable
  // would tell an anonymous caller exactly which piece of our deployment is
  // misconfigured (security.md §7: no internal leakage). The operator gets the
  // name from the server log instead, where it belongs.
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(`[profile-insights] missing environment variables: ${missing.join(', ')}`);
    return json(
      {
        error: 'Server configuration error',
        message: 'The insight service is not configured. Try again later.',
      },
      500,
    );
  }

  // ---- 2. Rate limit (Requirement 6.10) -------------------------------------
  //
  // Runs BEFORE the body is read or parsed, so a client that has spent its
  // budget cannot make us do work by sending a large body.
  const limit = await checkRateLimit(
    `profiler:insights:${clientKeyFrom(req)}`,
    INSIGHT_REQUEST_LIMIT,
    INSIGHT_WINDOW_MS,
  );

  // FAIL CLOSED. `checkRateLimit` returns `null` when it could not determine the
  // limit (Redis unreachable, timed out, or unusable reply); it takes no policy
  // position, so the policy lives here.
  //
  // DO NOT "FIX" THIS TO FAIL OPEN. `session-memory.ts` fails open on the same
  // kind of failure and that is correct there — losing chat history is
  // cosmetic. This path is different in kind: every accepted request spends
  // model tokens against a real bill, so serving unmetered requests while the
  // meter is down is the expensive failure, not the safe one. design.md records
  // this as a deliberate divergence from the existing pattern. A brief 503 while
  // Redis recovers is the cheaper outcome, and the client already renders the
  // returned message and keeps the profile on screen (Requirement 6.11).
  if (limit === null) {
    console.error('[profile-insights] rate limit undetermined; failing closed');
    return json(
      {
        error: 'Service unavailable',
        message: 'Insight generation is temporarily unavailable. Try again shortly.',
      },
      503,
    );
  }

  if (!limit.allowed) {
    // Requirement 6.10: state the limit AND the time remaining.
    return json(
      {
        error: 'Rate limit exceeded',
        message: `Limit reached: ${INSIGHT_REQUEST_LIMIT} insight requests per 60 minutes. Try again in ${formatWait(limit.retryAfterMs)}.`,
        limit: INSIGHT_REQUEST_LIMIT,
        retryAfterMs: limit.retryAfterMs,
      },
      429,
      { 'Retry-After': String(Math.max(1, Math.ceil(limit.retryAfterMs / 1000))) },
    );
  }

  // ---- 3. Validate (Requirements 6.5, 6.6) ---------------------------------
  //
  // Everything from here to the `parsed.data` binding is the only path to the
  // model, and it contains no model call. That is the structural form of
  // Requirement 6.6 — "SHALL issue no model request for that call" is not a
  // rule that has to be remembered, it is a consequence of the generation step
  // living after this block and reading only `parsed.data`.
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    // Not JSON at all — never reaches the schema, and never reaches the model.
    return json(
      { error: 'Invalid request body', message: 'Request body must be valid JSON.' },
      400,
    );
  }

  // `.strict()` is already applied inside `insightPayloadSchema`; restated here
  // because it is the load-bearing part of Requirement 6.5 and should be
  // visible at the call site rather than only in the schema module.
  const parsed = insightPayloadSchema.strict().safeParse(rawBody);
  if (!parsed.success) {
    return json(
      {
        error: 'Invalid insight payload',
        // Requirement 6.6: name the FIRST failing field.
        message: `Invalid insight payload: ${describeIssue(parsed.error.issues[0])}`,
      },
      400,
    );
  }

  // The validated object. Deliberately the ONLY value carried forward —
  // `rawBody` is not referenced again below this line.
  const validatedPayload = parsed.data;

  // ---- 4. Generate (Requirements 6.7, 6.8) ---------------------------------
  try {
    const result = await generateObject({
      model: getGroqClient()(MODEL_ID),
      schema: insightNarrativeSchema,
      // ==== Requirement 6.7: EXACTLY TWO INPUTS REACH THE MODEL ====
      //
      //   `system` <- INSIGHT_INSTRUCTION, a module constant in this file.
      //   `prompt` <- validatedPayload, the OUTPUT of safeParse.
      //
      // Serializing `parsed.data` rather than `rawBody` is the whole guarantee
      // and not a stylistic choice. `safeParse` returns a value rebuilt from
      // the schema, so even if a `.strict()` check were somehow bypassed, an
      // unknown key could not survive into this string — the object here has
      // only fields the schema declares. Passing `rawBody`, or concatenating
      // any request-derived string into `system`, would reintroduce exactly the
      // injection surface this design removes. There is no third input: no
      // `messages`, no header value, no query parameter.
      system: INSIGHT_INSTRUCTION,
      prompt: JSON.stringify(validatedPayload),
      // Low but non-zero: the task is interpretation, and near-zero
      // temperature on a structured schema tends toward terse, repetitive
      // observations that trip the schema's `.min(3)`.
      temperature: 0.3,
      maxOutputTokens: 2048,
    });

    // Requirement 6.8, second half: the schema constrains generation AND the
    // result is re-validated before responding. `generateObject` already
    // validates, so in practice this is belt-and-braces — but it is what makes
    // the 6.9 branch below reachable from our own code rather than only from
    // the SDK's internals, and it narrows `narrative` to `InsightNarrative`.
    const narrative = insightNarrativeSchema.safeParse(result.object);
    if (!narrative.success) {
      console.error('[profile-insights] model result failed narrative validation');
      // Requirement 6.9: no partial content. Nothing from `result.object` is
      // echoed — not a field, not a length, not a reason.
      return json(
        {
          error: 'Narrative generation failed',
          message: 'The narrative could not be generated. Try again.',
        },
        502,
      );
    }

    return json({ narrative: narrative.data }, 200);
  } catch (error) {
    // Everything from the model call collapses to one 502: a transport failure,
    // an upstream 429, an auth failure, and `NoObjectGeneratedError` (thrown by
    // `generateObject` when the model's output does not fit the schema) all mean
    // the same thing to the caller — there is no narrative. Requirement 6.9
    // wants that single message with no partial content, so unlike `/api/chat`
    // this route does not branch on the error text. The detail goes to the log.
    console.error('[profile-insights] generateObject failed:', error);
    return json(
      {
        error: 'Narrative generation failed',
        message: 'The narrative could not be generated. Try again.',
      },
      502,
    );
  }
}
