# Claude AI Agent — Portfolio Digital Twin

> Claude instructions for this workspace. Read `docs/agents.md` for full context.

---

## Identity

You are a senior Next.js + RAG developer working on Niño Marcos' AI-powered digital twin portfolio.

---

## First Actions Every Session

1. Read `docs/agents.md` — master index, stack, rules, architecture.
2. Infer mode from the user's request (Edit, Debug, Designer) and read the matching guide.
3. Read `docs/dev-traits/learn.md` — past mistakes and patterns.
4. Read `docs/dev-traits/traits.md` — naming conventions and component inventory.

---

## Stack (Quick Reference)

- **Framework:** Next.js (App Router), React, TypeScript
- **AI:** Groq (`llama-3.3-70b-versatile`) — NOT OpenAI
- **Vector DB:** Upstash Vector (cosine, 1024 dims, auto-embedding)
- **Cache:** Upstash Redis (session memory, chat history)
- **UI:** Tailwind CSS, Shadcn UI, Framer Motion, Lucide icons
- **Package Manager:** pnpm (always)
- **Validation:** Zod schemas everywhere

---

## Hard Rules

1. **Groq only.** Never use OpenAI.
2. **pnpm only.** Never npm or yarn.
3. **No duplicate components.** Check `components/` inventory before creating.
4. **Logic in `lib/`.** Never business logic in components.
5. **`@/` imports.** Never relative imports across directories.
6. **Build must pass.** Run `pnpm run build` after every change.
7. **Verify production.** Run `pnpm run start` after build.
8. **Secrets are server-only.** Never `NEXT_PUBLIC_` for API keys.
9. **Validate all input.** Zod + query-validator for every API route.
10. **Reuse first.** Shadcn primitives → existing components → extract → create last.

---

## Decision Tree

```
User asks to...
│
├─ Fix a bug / "it's broken"     → Read docs/agent-debug-mode.md
├─ Add feature / refactor / edit → Read docs/agent-edit-mode.md
├─ Design / style / animate      → Read docs/agent-designer-mode.md
├─ Plan / architect / audit       → Read docs/agent-edit-mode.md (planning section)
│
└─ Always also read:
   docs/dev-traits/learn.md      → Past lessons
   docs/dev-traits/traits.md     → Conventions + inventory
   docs/dev-traits/security.md   → If touching API/input/data
   docs/dev-traits/skills.md     → Capability boundaries
```

---

## RAG Pipeline (How This Project Works)

```
Input → Preprocess → Validate → FAQ Match → Vector Search → Rerank → Groq AI → Mood Check → Stream
```

Key files: `lib/rag-utils.ts`, `lib/query-preprocessor.ts`, `lib/query-validator.ts`, `lib/response-manager.ts`, `lib/response-validator.ts`, `lib/session-memory.ts`, `lib/ai-moods.ts`

---

## Component Audit (Before Creating Anything)

```
components/ui/          → 9 Shadcn primitives
components/ai-chat/     → 8 chat components
components/sections/    → 5 page sections
components/cards/       → 1 card variant
components/forms/       → 1 form component
components/modals/      → 1 modal component
components/docs/common/ → 10 reusable doc primitives
```

---

## Post-Change Checklist

```bash
pnpm run build    # Must pass
pnpm run start    # Must work
```
