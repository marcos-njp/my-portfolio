// lib/data-profiler/ask-client.ts
//
// The browser half of `/api/profile-qa`. Mirrors `insight-client.ts`: it never
// throws, it returns a discriminated outcome the hook switches on exhaustively,
// and it owns its own timeout.
//
// The one structural difference is that this response is a stream. The insight
// endpoint returns a whole object, so its client can `await response.json()`;
// here the answer arrives in pieces and `onDelta` hands each one to the caller
// so the panel can render as it goes.

import { QA_TIMEOUT_MS } from './constants';
import type { AskRequest } from './ask-schema';
import type { QuestionRejection } from './question-validator';

export const ASK_ENDPOINT = '/api/profile-qa';

export type AskFailure =
  /** The question was refused before the model was called (400 from the route). */
  | { kind: 'rejected'; reason: QuestionRejection | 'payload'; message: string }
  | { kind: 'rate-limit'; message: string; retryAfterMs: number | null }
  | { kind: 'http'; status: number; message: string }
  /**
   * A 200 that produced no text. The status is committed the moment the stream
   * opens, so a model failure after that point cannot arrive as an error code;
   * an empty body is the only signal left.
   */
  | { kind: 'empty-stream' }
  | { kind: 'timeout'; timeoutMs: number }
  | { kind: 'aborted' }
  | { kind: 'network' };

export type AskOutcome =
  | { ok: true; answer: string }
  | { ok: false; failure: AskFailure };

/** Shape of the route's JSON error bodies. Read defensively: it is a network value. */
interface ErrorBody {
  message?: unknown;
  reason?: unknown;
  retryAfterMs?: unknown;
}

async function readErrorBody(response: Response): Promise<ErrorBody> {
  try {
    const body: unknown = await response.json();
    return typeof body === 'object' && body !== null ? (body as ErrorBody) : {};
  } catch {
    return {};
  }
}

function messageOf(body: ErrorBody, fallback: string): string {
  return typeof body.message === 'string' && body.message.length > 0 ? body.message : fallback;
}

/**
 * Sends one question and streams the answer.
 *
 * `credentials: 'omit'` because this endpoint is anonymous and has no session;
 * sending cookies would attach identity to a request that does not need it.
 */
export async function askQuestion(
  request: AskRequest,
  onDelta: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<AskOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), QA_TIMEOUT_MS);

  // The caller's signal (a reset, or an unmount) relays into ours, so either
  // source can stop the request and only one signal reaches `fetch`.
  const relay = () => controller.abort();
  signal?.addEventListener('abort', relay);

  const timedOut = () => !(signal?.aborted ?? false);

  try {
    const response = await fetch(ASK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      credentials: 'omit',
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await readErrorBody(response);

      if (response.status === 429) {
        return {
          ok: false,
          failure: {
            kind: 'rate-limit',
            message: messageOf(body, 'Too many questions. Try again later.'),
            retryAfterMs: typeof body.retryAfterMs === 'number' ? body.retryAfterMs : null,
          },
        };
      }

      if (response.status === 400) {
        return {
          ok: false,
          failure: {
            kind: 'rejected',
            reason: typeof body.reason === 'string' ? (body.reason as QuestionRejection) : 'payload',
            message: messageOf(body, 'That question could not be sent.'),
          },
        };
      }

      return {
        ok: false,
        failure: {
          kind: 'http',
          status: response.status,
          message: messageOf(body, 'The answer could not be generated. Try again.'),
        },
      };
    }

    if (response.body === null) return { ok: false, failure: { kind: 'empty-stream' } };

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let answer = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      // `stream: true` so a multi-byte character split across two chunks is not
      // decoded as two replacement characters.
      const chunk = decoder.decode(value, { stream: true });
      if (chunk.length > 0) {
        answer += chunk;
        onDelta(chunk);
      }
    }

    const tail = decoder.decode();
    if (tail.length > 0) {
      answer += tail;
      onDelta(tail);
    }

    if (answer.trim().length === 0) return { ok: false, failure: { kind: 'empty-stream' } };

    return { ok: true, answer };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return timedOut()
        ? { ok: false, failure: { kind: 'timeout', timeoutMs: QA_TIMEOUT_MS } }
        : { ok: false, failure: { kind: 'aborted' } };
    }
    return { ok: false, failure: { kind: 'network' } };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', relay);
  }
}
