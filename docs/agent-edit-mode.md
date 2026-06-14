# Agent: Edit Mode

> For: bug fixes, new features, UI changes, refactoring.
> Read `docs/dev-traits/learn.md` and `docs/dev-traits/traits.md` FIRST.

---

## Decision Tree

```
What type of change?
│
├─ RAG Pipeline / AI Response Quality
│  READ: docs/dev-traits/learn.md §1 (RAG Architecture)
│  CHECK: lib/rag-utils.ts, lib/query-preprocessor.ts, lib/query-validator.ts
│  Response issue? → lib/response-manager.ts, lib/response-validator.ts
│  Mood issue? → lib/ai-moods.ts
│
├─ Chat UI / Interaction
│  CHECK: components/ai-chat/ (8 components)
│  CHECK: components/ui/ (9 primitives)
│  Sidebar issue? → components/ai-chat/chat-sidebar.tsx
│  Input issue? → components/ai-chat/chat-input.tsx
│  Message rendering? → components/ai-chat/chat-message.tsx
│
├─ Session / Memory
│  READ: docs/dev-traits/learn.md §1 (Session Architecture)
│  CHECK: lib/session-memory.ts
│  Redis issue? → Check UPSTASH_REDIS env vars
│  History not loading? → Check TTL and session ID generation
│
├─ MCP Integration
│  CHECK: app/api/[transport]/route.ts, lib/chat-mcp.ts
│  CHECK: app/actions/mcp-actions.ts
│  SSE issue? → Transport route config
│  Tool not found? → lib/chat-mcp.ts Zod schema
│
├─ Vector DB / Embeddings
│  CHECK: scripts/update-vector-db.ts
│  CHECK: data/digitaltwin.json (content chunks)
│  Missing context? → Re-run pnpm run update-vector
│  Bad relevance? → lib/rag-utils.ts thresholds
│
├─ New Section / Page
│  CHECK: components/sections/ (5 sections)
│  CHECK: app/page.tsx (section assembly)
│  Reuse existing section patterns
│  Add to layout navigation if needed
│
├─ New UI Component
│  CHECK: components/ui/ — does a primitive exist?
│  CHECK: components/ai-chat/ — does a chat component exist?
│  REUSE: Shadcn primitives (Button, Card, Dialog, Input, etc.)
│  Extract if pattern appears in 2+ places
│
├─ Styling / Theme
│  READ: docs/agent-designer-mode.md
│  CHECK: app/globals.css (theme variables)
│  CHECK: components/theme-provider.tsx, components/theme-toggle.tsx
│
├─ Data Update (Profile / Personality)
│  EDIT: data/digitaltwin.json (content chunks for vector DB)
│  EDIT: data/personality.json (core traits, communication style)
│  RUN: pnpm run update-vector (after digitaltwin.json changes)
│
├─ Security / Validation
│  READ: docs/dev-traits/security.md
│  CHECK: Zod schemas in API routes
│  CHECK: lib/query-validator.ts (input sanitization)
│
└─ Docs Page
   CHECK: components/docs/ (sidebar, 10 common, 10 sections)
   Reuse common/ components: AlertBox, CodeBlock, DocSection, etc.
```

---

## Context-Building Protocol

Before writing any code:

### 1. Trace the Stack
```
User interaction        → Component (components/)
State management        → localStorage / React state
API call                → app/api/ route
Business logic          → lib/ utils
Data source             → data/ JSON or Upstash Vector/Redis
```

### 2. Check Existing Tools
```
UI Primitives (9): button, card, contact-card, dialog, input,
                   philippine-time, select, textarea, timeline-card

Chat Components (8): chat-trigger, chat-sidebar, chat-input,
                     chat-message, chat-features-modal, comment-input,
                     mood-selector, suggested-questions

Lib Utils (12): rag-utils, query-preprocessor, query-validator,
                response-manager, response-validator, session-memory,
                feedback-detector, ai-moods, interviewer-faqs,
                url-resolver, chat-mcp, utils

Section Components (5): hero, tech-stack, projects, experience, education
Doc Common (10): AlertBox, CodeBlock, ComparisonGrid, DocSection,
                 HighlightBox, MetricGrid, MobileNav, StarCard,
                 StepList, Tabs, TroubleshootCard
```

### 3. Update ALL Affected Files
When a change affects other files, update them too:
- Changed a component's props? → Update all consumers.
- Changed a lib function signature? → Update all callers.
- Changed Zod schema? → Update both API route and client.
- Changed `digitaltwin.json`? → Run `pnpm run update-vector`.
- Added a new section? → Update `app/page.tsx` and navigation.

---

## Post-Edit Checklist

```bash
pnpm run build    # MANDATORY — must pass
pnpm run start    # Verify in production mode
```

- [ ] No console errors in browser
- [ ] Chat functionality works (send message, get streamed response)
- [ ] Mood switching works (GenZ ↔ Professional)
- [ ] Theme toggle works (light/dark)
- [ ] All affected files updated
- [ ] No duplicate component markup introduced
