# learn.md — Project Knowledge Base

> Read this FIRST every session. Contains architecture knowledge, key patterns,
> and past mistakes. This is the AI's institutional memory for this RAG portfolio.

---

## 1. Architecture Knowledge

### RAG Pipeline Design
- **Query flow:** Input → Preprocess → Validate → FAQ Match → Vector Search → Rerank → LLM → Validate → Stream
- **Vector search:** top_k=3 chunks, minScore=0.6, fallback to top 2 at ≥0.65.
- **Reranking:** Boost scores for queries matching categories (technical, projects, education).
- **Context relevance:** Validate retrieved chunks actually answer the question before sending to LLM.
- **Knowledge gap detection:** If context is insufficient, return honest fallback instead of hallucination.

### Session Architecture
- **8-message window** for AI context (keeps token cost low).
- **Complete history** stored separately in Redis for UI display.
- **1-hour TTL** on Redis keys — sessions expire naturally.
- **Dual save pattern:** `chat_session:{id}` (AI window) + `chat_history:{id}` (full display).
- **Session ID:** Random UUID + timestamp, persisted in localStorage.

### Mood System
- **Two modes:** GenZ (casual, slang, emojis) and Professional (formal, structured).
- **Compliance thresholds:** GenZ ≥ 35/100, Professional ≥ 50/100.
- **Mood switching** mid-conversation doesn't clear history.
- **Mood affects:** system prompt additions, response styling, UI colors (purple/blue).

### Component Architecture
- **Shadcn UI** for all primitives — never custom-build what exists.
- **Domain separation:** `ai-chat/` for chat, `sections/` for page, `ui/` for shared.
- **Docs components:** `common/` for reusable primitives, `sections/` for content.
- **No prop drilling:** Keep component interfaces minimal and focused.

### MCP Integration
- **Single tool:** `chat_with_digital_twin` exposed via SSE transport.
- **Node.js runtime** (not edge) for MCP route — SSE needs long-lived connections.
- **60-second timeout** with AbortSignal.
- **Server action bridge:** `mcp-actions.ts` wraps chat API for tool execution.

### Adaptive Feedback
- **Learning from user:** Detects preferences (shorter, longer, more detail, tone).
- **5 recent items** per session — not persistent across sessions.
- **~30 token overhead** per learned preference in system prompt.
- **Rejects manipulation:** Won't learn "ignore rules" or similar attempts.

---

## 2. Key Anti-Patterns (Don't Do This)

| Don't | Why | Do instead |
|-------|-----|-----------|
| Use OpenAI | Project uses Groq for cost/speed | `@ai-sdk/groq` with `openai/gpt-oss-120b` |
| Skip query validation | Opens door to prompt injection | Full validation chain every time |
| Duplicate component markup | Maintenance nightmare | Check inventory, reuse or extract |
| Put logic in components | Violation of separation | Extract to `lib/` utilities |
| Hardcode profile data in prompts | Stale data, no vector search | Use `digitaltwin.json` + vector DB |
| Use npm or yarn | Project uses pnpm | Always `pnpm` |
| Import with relative paths across dirs | Fragile imports | Use `@/` alias |
| Create new Shadcn-like primitives | Already exists in `components/ui/` | Use existing Shadcn components |
| Skip `pnpm run build` | Catches type errors, build issues | Always build after changes |
| Modify vector DB manually | Script handles chunking + metadata | `pnpm run update-vector` |
| Use `dangerouslySetInnerHTML` | XSS vulnerability | React auto-escaping |
| Store secrets in `NEXT_PUBLIC_` | Client-exposed | Server-only env vars |

---

## 3. Lessons Learned

> Append new lessons here as they occur. Format: date — lesson.

<!-- Example:
- 2026-04-06 — Edge runtime cannot import `fs` module. MCP route must use Node.js runtime.
- 2026-04-06 — Upstash Vector auto-embeds text data. Don't pre-compute embeddings.
- 2026-09-05 — Auto-embedding still holds, but it depends on HOW the index was created. An Upstash index created as **Custom** (no Embedding Model selected) rejects `data:` with "Embedding data for this index is not allowed" and requires `vector:` on every call. The current index selects the hosted `openai/text-embedding-3-small`, so `data:` works. Its dimension is **1536** and is locked by the hosted model - not 1024. Check `index.info().denseIndex.embeddingModel` before assuming.
- 2026-09-05 — `KNOWLEDGE_GAP_PATTERNS` in `data/rag-config.ts` was rejecting "tell me about yourself" and "what can you do" as vague_inquiry, returning HTTP 400 for the two most common interview openers — while `FAQ_PATTERNS.introduction` was built to answer exactly those. When adding a rejection pattern, check it against FAQ_PATTERNS first; the two lists live in the same file and must not contradict each other.
- 2026-09-05 — Score distributions are model-specific. Retrieval tops out around 0.65-0.75 with `text-embedding-3-small`, so the `minScore: 0.75` default in `rag-utils.ts` would reject everything. The route works only because it passes `routeMinScore` (0.60). Re-measure real scores after any embedding-model change instead of trusting inherited thresholds.
- 2026-09-05 — Follow-ups must be resolved against history BEFORE embedding. Embedding "tell me more about that first one" verbatim ranked the correct chunk 3rd at 0.592 (below the 0.60 cut, so it was discarded) and surfaced unrelated chunks at 0.62 that were then labelled RELEVANT CONTEXT — the model invented "Render" and "300 queries" to bridge the gap. `resolveFollowUpQuery` folds the last turns into the search query; the correct chunk now ranks 1st at 0.836.
- 2026-09-05 — Removed ~620 lines of over-engineering: the unreachable Tier-2 fallback in `searchVectorContext` (the route passes minScore 0.60, so a >=0.65 fallback could never fire), `validateMoodCompliance` (171 lines that only console.warn'd), `response-manager.ts` (a wrapper around a constant string), the Levenshtein/typo-dictionary pass, `enhanceQuery` (which appended filler into the text being embedded), `validateContextRelevance`, and the FAQ hint system. Off-topic questions are still handled correctly — by the retrieval fallback rather than regex blocklists, which is why the brittle entertainment/offtopic/tech_preferences patterns could go. Prefer letting retrieval decide over hand-maintained regex.
- 2026-09-05 — A vector-store outage used to be invisible: `searchVectorContext` caught the error and returned an empty context, which the route treated as a knowledge gap and answered with a canned 200 fallback. Retrieval failure now sets `retrievalFailed` and the route returns 503. Never let an infra failure masquerade as "I don't know".
-->

- 2026-09-05 - Chat history cannot rely on Redis alone. The old UI kept messages in React state only and offered a manual "History" button, so every reload dropped the thread, and Redis expires it after an hour anyway. `lib/chat-store.ts` now owns the UI side: multiple named sessions, every prompt and reply, the mood, and the unsent draft, all in localStorage under `nm_chat_state_v1`, restored on mount. Redis stays the server-side AI context window and is used only as a fallback when a session is empty locally. Writes are debounced 300ms and flushed on `pagehide` so streaming does not thrash storage.
- 2026-09-05 - Page navigation lives in `components/sections/side-nav.tsx` (fixed left rail on `lg`, slide-in drawer below it), not a top header. Section ids and the nav indices must stay in sync: `about 00, ai-chat 01, approach 02, experience 03, education 04, contact 05`. Scroll-spy uses an IntersectionObserver with `rootMargin: -45% 0px -45% 0px`; sections need `scroll-mt-16` so the mobile bar does not cover their headings.
- 2026-09-05 - Visual system is squared: `--radius` is `0.25rem`, `.nm-link` is a 2px-radius pill, and there are no coloured accent bars or left-border strips. Red is for the LED, the accent link and hover states only. Active nav and tab states use `border-border bg-secondary`, never `border-primary`. Copy uses commas and colons, never middots or em dashes.

---
