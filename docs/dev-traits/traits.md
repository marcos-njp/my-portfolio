# traits.md — Project Conventions & Coding Traits

> Defines naming rules, file placement, and structural decisions.
> Any AI or developer writing code for this project MUST follow these traits.

---

## 0. The Golden Rule — No Repeated Markup

Before writing any JSX for a UI pattern:

1. Check `components/ui/` and `components/ai-chat/` for existing components.
2. If it exists — **use it.** Never duplicate the markup.
3. If the same pattern appears in two places and no component exists — **extract it now.**

One design update in one file = updated everywhere. This is the entire philosophy.

---

## 1. Naming Conventions

### TypeScript / Next.js

| Entity | Convention | Example |
|--------|-----------|---------|
| Components | PascalCase, one per file | `ChatSidebar`, `HeroSection` |
| UI primitives | kebab-case file, PascalCase export | `button.tsx` → `Button` |
| Pages | lowercase, Next.js App Router | `app/page.tsx`, `app/docs/page.tsx` |
| API routes | lowercase, route.ts | `app/api/chat/route.ts` |
| Server actions | camelCase functions | `chatWithDigitalTwin()` |
| Lib utilities | kebab-case file, camelCase exports | `rag-utils.ts` → `searchVectorDB()` |
| Hooks | camelCase with `use` prefix | `useTheme`, `useForm` |
| Types/Interfaces | PascalCase | `ChatMessage`, `MoodConfig` |
| Constants | UPPER_SNAKE_CASE | `MAX_SESSION_MESSAGES` |
| Zod schemas | camelCase + Schema suffix | `chatRequestSchema` |
| Data files | kebab-case JSON | `digitaltwin.json`, `personality.json` |

### CSS / Styling

| Entity | Convention | Example |
|--------|-----------|---------|
| CSS variables | kebab-case with `--` prefix | `--background`, `--foreground` |
| Tailwind classes | utility-first, responsive mobile-first | `text-sm md:text-base` |
| Dark mode | `dark:` prefix | `bg-white dark:bg-gray-900` |

---

## 2. File Structure

```
app/
  layout.tsx              ← Global layout (nav, theme, fonts)
  page.tsx                ← Main portfolio page (section assembly)
  globals.css             ← Theme CSS variables + base styles
  actions.ts              ← Server actions
  actions/                ← Domain-specific server actions
    mcp-actions.ts
  api/
    chat/                 ← Chat API (edge runtime)
      route.ts
      clear/route.ts
      history/route.ts
    [transport]/           ← MCP SSE endpoint (node runtime)
      route.ts
  docs/                   ← Documentation page
    layout.tsx
    page.tsx
    content.tsx

components/
  theme-provider.tsx      ← next-themes wrapper
  theme-toggle.tsx        ← Dark/light toggle
  ui/                     ← SHADCN PRIMITIVES (check here first)
    button.tsx, card.tsx, dialog.tsx, input.tsx, select.tsx, textarea.tsx
    contact-card.tsx, philippine-time.tsx, timeline-card.tsx
  ai-chat/                ← CHAT INTERFACE (8 components)
    chat-trigger.tsx      ← Floating chat button
    chat-sidebar.tsx      ← Main chat panel
    chat-input.tsx        ← Message input with mood styling
    chat-message.tsx      ← Message bubble rendering
    chat-features-modal.tsx
    comment-input.tsx
    mood-selector.tsx
    suggested-questions.tsx
  sections/               ← PAGE SECTIONS (5 sections)
    hero-section.tsx, tech-stack.tsx, projects-section.tsx,
    experience-section.tsx, education-section.tsx
  cards/                  ← Card variants
    project-card.tsx
  forms/                  ← Form components
    contact-form.tsx
  modals/                 ← Modal components
    project-modal.tsx
  docs/                   ← Documentation components
    DocsSidebar.tsx
    common/               ← 10 reusable doc primitives
    sections/             ← 10 doc content sections

lib/                      ← ALL BUSINESS LOGIC + UTILS
  rag-utils.ts            ← Vector search, reranking, relevance
  query-preprocessor.ts   ← Typo fix, normalization
  query-validator.ts      ← Input validation, rejection
  response-manager.ts     ← Length, follow-ups
  response-validator.ts   ← Mood compliance
  session-memory.ts       ← Redis session management
  feedback-detector.ts    ← Adaptive learning
  ai-moods.ts             ← Mood configs (GenZ, Professional)
  interviewer-faqs.ts     ← FAQ patterns for RAG boost
  url-resolver.ts         ← API domain resolution
  chat-mcp.ts             ← MCP tool definition
  projects-data.ts        ← Static project data
  utils.ts                ← General utilities (cn, etc.)

data/                     ← STATIC DATA (source of truth)
  digitaltwin.json        ← Profile + content chunks for vector DB
  personality.json        ← AI personality configuration
  readmeData.md           ← README content

scripts/
  update-vector-db.ts     ← Seeds Upstash Vector from digitaltwin.json

docs/                     ← AI AGENT INSTRUCTIONS (you are here)
  agents.md               ← Master index
  agent-debug-mode.md     ← Debug protocol
  agent-edit-mode.md      ← Edit decision tree
  agent-designer-mode.md  ← Designer protocol
  dev-traits/             ← Knowledge base
    traits.md, security.md, learn.md, skills.md
```

---

## 3. Component Inventory

### UI Primitives (9)
| Component | File | Used for |
|-----------|------|----------|
| `Button` | `ui/button.tsx` | All clickable actions |
| `Card` | `ui/card.tsx` | Content containers |
| `ContactCard` | `ui/contact-card.tsx` | Contact info display |
| `Dialog` | `ui/dialog.tsx` | Modal overlays |
| `Input` | `ui/input.tsx` | Text inputs |
| `PhilippineTime` | `ui/philippine-time.tsx` | Live time display |
| `Select` | `ui/select.tsx` | Dropdown selections |
| `Textarea` | `ui/textarea.tsx` | Multi-line inputs |
| `TimelineCard` | `ui/timeline-card.tsx` | Timeline entries |

### Chat Components (8)
| Component | File | Used for |
|-----------|------|----------|
| `ChatTrigger` | `ai-chat/chat-trigger.tsx` | Floating open button |
| `ChatSidebar` | `ai-chat/chat-sidebar.tsx` | Main chat panel |
| `ChatInput` | `ai-chat/chat-input.tsx` | Message input |
| `ChatMessage` | `ai-chat/chat-message.tsx` | Message bubbles |
| `ChatFeaturesModal` | `ai-chat/chat-features-modal.tsx` | Feature docs |
| `CommentInput` | `ai-chat/comment-input.tsx` | Comment entry |
| `MoodSelector` | `ai-chat/mood-selector.tsx` | GenZ/Professional toggle |
| `SuggestedQuestions` | `ai-chat/suggested-questions.tsx` | Context suggestions |

---

## 4. Import Rules

```typescript
// Shadcn UI
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// Lib utilities
import { searchVectorDB } from "@/lib/rag-utils"
import { cn } from "@/lib/utils"

// Data
import digitalTwin from "@/data/digitaltwin.json"

// NEVER relative imports across directories — always @/ alias
```
