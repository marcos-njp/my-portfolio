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
| Use OpenAI | Project uses Groq for cost/speed | `@ai-sdk/groq` with `llama-3.3-70b-versatile` |
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
-->

---
