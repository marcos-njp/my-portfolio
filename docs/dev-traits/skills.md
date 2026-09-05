# skills.md — AI Capability & Constraint Catalogue

> What the AI agent working on this portfolio knows, can do, and must not do.

---

## 1. Technology Proficiencies

### Next.js 16 + App Router

| Skill | Level | Notes |
|-------|-------|-------|
| App Router (pages, layouts, loading) | Expert | File-based routing with `app/` directory |
| Server Components vs Client | Expert | `use client` directive for interactive components |
| Server Actions | Expert | `actions.ts`, `mcp-actions.ts` for server-side operations |
| API Routes (edge + node) | Expert | Edge for `/api/chat`, Node for MCP SSE |
| Streaming responses | Expert | `streamText()` from Vercel AI SDK |
| Middleware | Proficient | Edge middleware for request handling |

### RAG / AI Pipeline

| Skill | Level | Notes |
|-------|-------|-------|
| Groq AI SDK | Expert | `openai/gpt-oss-120b`, streaming, system prompts |
| Upstash Vector | Expert | Cosine similarity, 1536 dims, hosted auto-embedding |
| Upstash Redis | Expert | Session memory, chat history, TTL management |
| Query preprocessing | Expert | Typo fix, normalization, Levenshtein distance |
| Semantic validation | Expert | Pattern matching, rejection categories |
| Context reranking | Expert | Category-based score boosting |
| Mood compliance | Expert | GenZ/Professional validation scoring |
| Adaptive feedback | Proficient | User preference learning, manipulation rejection |

### React 19 + TypeScript

| Skill | Level | Notes |
|-------|-------|-------|
| Functional components | Expert | Hooks-only, no class components |
| Zod validation | Expert | Schema-first API contracts |
| Framer Motion | Proficient | Enter/exit animations, AnimatePresence |
| Shadcn UI | Expert | Primitives: Button, Card, Dialog, Input, Select, Textarea |
| Tailwind CSS 4 | Expert | Utility-first, responsive, dark mode |
| next-themes | Proficient | System/light/dark theme switching |

### Infrastructure

| Skill | Level | Notes |
|-------|-------|-------|
| Vercel deployment | Proficient | Edge + serverless functions |
| Upstash cloud | Expert | Vector DB + Redis provisioning |
| MCP Protocol | Proficient | SSE transport, tool registration |
| pnpm | Expert | Package management, scripts |

---

## 2. Anti-Skills — What AI Must NOT Do

| Anti-Skill | Reason |
|-----------|--------|
| Use OpenAI or any non-Groq provider | Stack constraint: Groq only |
| Create duplicate component patterns | Golden rule: no repeated markup |
| Put business logic in components | Logic lives in `lib/` |
| Skip query validation | Security requirement |
| Use npm or yarn | Project uses pnpm exclusively |
| Skip `pnpm run build` | Build must pass before task is done |
| Hardcode profile data | Use `data/` files + vector DB |
| Use `NEXT_PUBLIC_` for secrets | Server-only env vars |
| Create custom primitives that Shadcn provides | Use existing `components/ui/` |
| Delete files without user confirmation | Destructive actions need approval |
| Use raw CSS animations for interactions | Framer Motion for interactive elements |
| Import across directories with relative paths | Always use `@/` alias |

---

## 3. Code Generation Capabilities

| Area | Can Generate | Location |
|------|-------------|----------|
| UI Components | Shadcn-based, reusable, typed props | `components/{domain}/` |
| API Routes | Edge/Node, Zod-validated, streaming | `app/api/` |
| Server Actions | Typed, error-handled | `app/actions/` |
| Lib Utilities | Pure functions, well-typed | `lib/` |
| RAG Pipeline | Vector search, preprocessing, validation | `lib/` |
| Data Schemas | Zod schemas for all API contracts | Inline in routes |
| Scripts | DB seeding, maintenance | `scripts/` |
| Test utilities | Unit tests for lib functions | `__tests__/` (when needed) |

---

## 4. Component Inventory

### Where to put new components

| Type | Directory | Example |
|------|-----------|---------|
| Shared UI primitive | `components/ui/` | Button, Input, Card |
| Chat-specific | `components/ai-chat/` | ChatMessage, MoodSelector |
| Page section | `components/sections/` | HeroSection, TechStack |
| Card variant | `components/cards/` | ProjectCard |
| Form | `components/forms/` | ContactForm |
| Modal | `components/modals/` | ProjectModal |
| Doc primitive | `components/docs/common/` | CodeBlock, AlertBox |
| Doc content | `components/docs/sections/` | RagArchitectureSection |
| Global provider | `components/` (root) | ThemeProvider |
