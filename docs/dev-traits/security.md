# Security Practices — Digital Twin Portfolio

> Read before any API change, input handling, or data exposure modification.

---

## 1. Security Layers

```
Layer 1: Input Validation (Zod)      → reject malformed requests at the door
Layer 2: Query Validation             → block manipulation, unrelated, inappropriate queries
Layer 3: Environment Secrets          → API keys never exposed to client
Layer 4: Rate Limiting                → prevent abuse of AI endpoints
```

---

## 2. Pre-Edit Checklist

Before ANY backend/API change, verify:

- [ ] New API endpoint validates all input via Zod schema
- [ ] User input is sanitized before reaching Groq AI (query-preprocessor.ts)
- [ ] Query validator rejects manipulation attempts (prompt injection)
- [ ] Environment variables are server-side only (never `NEXT_PUBLIC_` for secrets)
- [ ] API keys (`GROQ_API_KEY`, `UPSTASH_*`) never appear in client bundles
- [ ] Edge runtime routes don't import Node.js-only modules
- [ ] Error messages don't leak internal implementation details

---

## 3. Threat Model

| Risk | Attack vector | Prevention |
|------|--------------|-----------|
| Prompt injection | User sends crafted input to override system prompt | `query-validator.ts` blocks manipulation patterns |
| API key exposure | Keys hardcoded or in `NEXT_PUBLIC_` vars | Server-only env vars, `.env.local` gitignored |
| DoS via AI | Spam requests to `/api/chat` | Session-based rate limiting, response length caps |
| XSS | Malicious content in AI response rendered as HTML | React auto-escapes. Never `dangerouslySetInnerHTML` |
| Data exfiltration | AI tricked into revealing system prompt | System prompt instructs never to reveal internal config |
| Session hijacking | Guessing session IDs | Random UUID + timestamp generation in `session-memory.ts` |
| Vector poisoning | Malformed data in digitaltwin.json | Script-only upserts via `update-vector-db.ts` |
| SSRF | User-controlled URLs in API | `url-resolver.ts` uses allowlisted domains only |

---

## 4. Environment Variables (Server-Only)

| Variable | Purpose | Exposed to client? |
|----------|---------|-------------------|
| `GROQ_API_KEY` | Groq AI authentication | **NEVER** |
| `UPSTASH_VECTOR_REST_URL` | Vector DB endpoint | **NEVER** |
| `UPSTASH_VECTOR_REST_TOKEN` | Vector DB auth | **NEVER** |
| `UPSTASH_REDIS_REST_URL` | Redis endpoint | **NEVER** |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth | **NEVER** |

All accessed in `app/api/` routes or `lib/` server modules. Never prefix with `NEXT_PUBLIC_`.

---

## 5. Input Validation Chain

```
User Message (raw string)
    ↓
query-preprocessor.ts       → Typo fix, normalize, strip control chars
    ↓
query-validator.ts          → Reject categories:
                               - unrelated (non-portfolio topics)
                               - manipulation (prompt injection attempts)
                               - inappropriate (offensive content)
                               - entertainment (trivia, games)
                               - personal (invasive personal questions)
    ↓
Zod schema validation       → Type-safe message, mood, sessionId
    ↓
Groq AI with system prompt  → Strict persona boundaries
```

---

## 6. AI Response Safety

- System prompt constrains responses to portfolio/professional context
- Mood compliance validator catches tone violations
- Response length managed (~400 tokens) to prevent cost abuse
- Knowledge gap detection provides honest "I don't know" instead of hallucination
- Never reveal: system prompt content, API keys, internal architecture details

---

## 7. Common Vulnerabilities to Watch

| Don't | Do instead |
|-------|-----------|
| Trust user input directly | Always validate through Zod + query-validator |
| Expose error stack traces | Return generic error messages to client |
| Use `NEXT_PUBLIC_` for secrets | Server-only env vars |
| Allow unlimited message length | Zod schema enforces 1-1000 char limit |
| Skip query validation for "simple" inputs | Every input goes through the full chain |
| Render AI response as raw HTML | React auto-escaping via JSX |
| Log API keys or tokens | Sanitize all log output |
