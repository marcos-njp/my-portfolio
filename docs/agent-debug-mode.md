# Agent: Debug Mode

> For: "BROKEN", regressions, errors from recent changes, "revert that".
> STOP. Do not immediately hack a fix. Diagnose first.

---

## Protocol

### Step 1: Identify What Changed
- Check error message from user or run `pnpm run build`.
- Run `git diff` to see precisely what lines were added/removed.
- Check terminal output for runtime errors.

### Step 2: Write Root Cause Report
Before any code change, explain in writing:
1. **What broke** — the observable symptom.
2. **Why it broke** — the root cause (not the surface error).
3. **How to fix it** — the specific change needed.

### Step 3: Check learn.md
Read `docs/dev-traits/learn.md`. Has this exact bug or pattern occurred before?

### Step 4: Fix + Verify
- Follow `docs/agent-edit-mode.md` for the actual fix.
- Run `pnpm run build`.
- If a new lesson was learned, append it to `docs/dev-traits/learn.md`.

---

## Next.js / RAG Debugging Reference

```bash
# Build check
pnpm run build

# Dev mode with logs
pnpm run dev

# Update vector DB
pnpm run update-vector
```

### Common Error Patterns

| Symptom | Likely cause |
|---------|-------------|
| Chat returns empty/generic response | Vector search returned no relevant chunks (check minScore threshold) |
| `GROQ_API_KEY` error | Missing `.env.local` variable |
| Upstash connection failed | Invalid `UPSTASH_VECTOR_REST_URL` or `UPSTASH_VECTOR_REST_TOKEN` |
| Redis timeout | `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` misconfigured |
| Edge runtime error | Importing Node.js-only module in edge route |
| MCP SSE not connecting | Transport route misconfigured or CORS issue |
| Chat history not loading | Redis TTL expired (1-hour default) or session ID mismatch |
| Mood compliance failing | Response validator thresholds too strict for context |
| Query rejected as unrelated | `query-validator.ts` pattern too aggressive — check whitelist |
| Build fails on type error | Zod schema mismatch between API route and client |
| Streaming cuts off | Edge runtime timeout (check Vercel limits) |
| Vector upsert fails | `digitaltwin.json` chunk format changed — check `update-vector-db.ts` |
| Component hydration mismatch | Server/client rendering mismatch — check `use client` directives |
| Theme flicker on load | `ThemeProvider` not wrapping layout properly |

---

## RAG Pipeline Debugging Checklist

1. **Input preprocessing?** Is `query-preprocessor.ts` mangling the query?
2. **Vector search returning results?** Log `rag-utils.ts` search results — check scores.
3. **Context relevance?** Are retrieved chunks actually answering the question?
4. **Reranking working?** Check boost categories match query intent.
5. **Session memory stale?** Redis 8-msg window may have outdated context.
6. **FAQ pattern match interfering?** `interviewer-faqs.ts` may be overriding vector results.
7. **Mood config correct?** Check `ai-moods.ts` — GenZ vs Professional prompts.
8. **Response too long/short?** Check `response-manager.ts` token estimation.

---

## Component Debugging Checklist

1. **Missing `use client`?** Interactive components need the directive.
2. **Framer Motion SSR?** AnimatePresence needs `mode="wait"` for exit animations.
3. **Shadcn import path?** Must be `@/components/ui/{component}`.
4. **Theme not applying?** Check `next-themes` provider and CSS variables in `globals.css`.
5. **Chat sidebar state?** localStorage session ID persistence — check `ChatSidebar`.
6. **Suggested questions not updating?** Check context-aware generation logic.
