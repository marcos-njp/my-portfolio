# Portfolio Digital Twin — Agent Instructions

> Master index for AI agents. Read this first, every session.
> Role: Senior Next.js + RAG developer building an AI-powered digital twin portfolio.

**Last updated:** April 6, 2026

---

## /workflow — Mode Inference

Infer your mode from the user's prompt. Read the matching guide immediately.

| Task feels like... | Mode | Read first |
|---|---|---|
| Architecture, audits, "how should we do X?" | Planning | `docs/agent-edit-mode.md` (planning section) |
| Bug fix, new feature, UI change, refactor | Edit | `docs/agent-edit-mode.md` |
| Broken, regression, "revert", error trace | Debug | `docs/agent-debug-mode.md` |
| UI/UX, layout, styling, animations, themes | Designer | `docs/agent-designer-mode.md` |

**Before ANY code change, also read:**
- `docs/dev-traits/learn.md` — has this area caused problems before?
- `docs/dev-traits/traits.md` — naming conventions and component inventory

---

## /stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **AI:** Groq AI (`openai/gpt-oss-120b`), Vercel AI SDK (`streamText`)
- **Vector DB:** Upstash Vector (dense, 1536 dims, cosine, hosted `text-embedding-3-small` auto-embedding)
- **Cache/Session:** Upstash Redis (8-msg session window, 1-hour TTL history)
- **Styling:** Tailwind CSS 4, Shadcn UI, Framer Motion
- **Validation:** Zod schemas throughout
- **MCP:** `mcp-handler` package, SSE transport, single `chat_with_digital_twin` tool
- **Package Manager:** pnpm (always)
- **Runtime:** Edge for chat API, Node.js for MCP server

---

## /rules — Hard Constraints (Never Violate)

### AI / RAG Pipeline

1. **Use Groq AI only.** Never OpenAI directly. Model: `openai/gpt-oss-120b`.
2. **Vector search before LLM call.** Always retrieve context (top_k=3, minScore=0.6) before generating.
3. **Session memory = 8 messages.** Token-efficient window. Complete history stored separately.
4. **Validate queries before RAG.** Use `query-validator.ts` — reject unrelated/manipulation attempts.
5. **Preprocess all input.** Typo fix → normalization → validation. Never skip.
6. **Mood compliance is mandatory.** Validate every response against mood config (GenZ ≥35, Professional ≥50).

### Frontend

7. **No duplicate components.** Check `components/` inventory before creating. Extract if pattern appears twice.
8. **Reusable first.** All shared UI in `components/ui/`. Domain components in `components/{domain}/`.
9. **Hooks and utils separated.** Logic in `lib/`, never inline complex logic in components.
10. **Shadcn UI for primitives.** Button, Card, Dialog, Input, Select, Textarea from `components/ui/`.
11. **No bare fetch in components.** Use server actions or API routes.
12. **Framer Motion for animations.** No raw CSS animations for interactive elements.

### Build & Deploy

13. **Run `pnpm run build` after every change.** Must pass before task is done.
14. **Run `pnpm run start` to verify.** Production mode check.
15. **pnpm only.** Never npm or yarn.
16. **Edge runtime for chat.** Keep `/api/chat` on edge for latency.

### Data

17. **Never hardcode profile data.** All digital twin data in `data/digitaltwin.json`.
18. **Personality config in `data/personality.json`.** Core traits, communication style, work ethic.
19. **Vector DB updates via script.** `pnpm run update-vector` — never manual upserts.

---

## /architecture — RAG Pipeline

```
User Input → Typo Fix → Normalization → Query Validation → FAQ Match
    ↓
Vector Search (top_k=3, minScore=0.6) → Reranking → Relevance Validation
    ↓
Context Building → System Prompt + Mood → Groq AI Response (streaming)
    ↓
Mood Compliance Check → Session Memory Save → Stream to Client
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/rag-utils.ts` | Vector search, reranking, context relevance |
| `lib/query-preprocessor.ts` | Typo fix, normalization, text-speak detection |
| `lib/query-validator.ts` | Semantic validation, rejection categories |
| `lib/response-manager.ts` | Length guidelines, follow-up suggestions |
| `lib/response-validator.ts` | Mood compliance scoring |
| `lib/session-memory.ts` | Redis session management (8-msg window) |
| `lib/feedback-detector.ts` | Adaptive feedback learning |
| `lib/ai-moods.ts` | Mood config, persona responses, fallbacks |
| `lib/interviewer-faqs.ts` | FAQ pattern matching for RAG guidance |
| `lib/url-resolver.ts` | API domain resolution (edge/server/client) |
| `lib/chat-mcp.ts` | MCP tool definition (Zod schema) |
| `app/api/chat/route.ts` | Main chat endpoint (edge runtime) |
| `app/api/[transport]/route.ts` | MCP server (SSE transport) |
| `scripts/update-vector-db.ts` | Vector DB seeding from digitaltwin.json |

---

## /components — Inventory

### Shared UI (`components/ui/`)
button, card, contact-card, dialog, input, philippine-time, select, textarea, timeline-card

### AI Chat (`components/ai-chat/`)
chat-trigger, chat-sidebar, chat-input, chat-message, chat-features-modal, comment-input, mood-selector, suggested-questions

### Sections (`components/sections/`)
hero-section, tech-stack, projects-section, experience-section, education-section

### Cards (`components/cards/`)
project-card

### Forms (`components/forms/`)
contact-form

### Modals (`components/modals/`)
project-modal

### Docs (`components/docs/`)
DocsSidebar, common/ (10 reusable doc components), sections/ (10 doc sections)

---

## /approach — How to Work

1. **Read before writing.** Build context by reading actual source files before any change.
2. **Trace the full stack.** Component → lib util → API route → data source.
3. **Audit before creating.** Check `components/ui/` and `components/ai-chat/` before building anything new.
4. **Update affected code.** When a change affects other files (imports, props, types), update ALL affected files.
5. **Extract when repeated.** If a pattern appears in two places with no component, extract it now.
6. **Confirm before destructive actions.** Never delete files or push code without user approval.

---

## /avoid — Common Mistakes

| Mistake | Correct approach |
|---------|-----------------|
| Use OpenAI instead of Groq | Always `@ai-sdk/groq` with `openai/gpt-oss-120b` |
| Skip query validation | Always validate through `query-validator.ts` |
| Duplicate component markup | Check inventory, reuse or extract |
| Inline complex logic in JSX | Extract to `lib/` utils or custom hooks |
| Hardcode digital twin data | Use `data/digitaltwin.json` + vector search |
| Use npm/yarn | Always pnpm |
| Skip build check | `pnpm run build` must pass |
| Create components without checking existing | Audit `components/` first |
| Put business logic in API routes | Extract to `lib/` service files |
| Ignore mood compliance | Validate every AI response |
