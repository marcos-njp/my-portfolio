# Agent: Designer Mode

> For: UI/UX changes, layout, styling, animations, themes, visual polish.
> Read `docs/dev-traits/traits.md` for naming conventions. Check component inventory before creating.

---

## Protocol

### Step 1: Understand the Visual Context
- What page/section is being changed?
- What components are already in use?
- What is the current theme setup (light/dark)?

### Step 2: Check Existing Components
Before creating any new component:
```
components/ui/           → Shadcn primitives (Button, Card, Dialog, etc.)
components/ai-chat/      → Chat interface components
components/sections/      → Page sections (hero, tech-stack, projects, etc.)
components/cards/         → Card variants
components/forms/         → Form components
components/modals/        → Modal components
components/docs/common/   → Reusable doc components
```

### Step 3: Design Within Constraints
- **Shadcn UI** for all primitive components — never custom from scratch.
- **Tailwind CSS 4** for styling — no inline styles, no CSS modules.
- **Framer Motion** for interactive animations — not raw CSS keyframes.
- **next-themes** for dark/light mode — use CSS variables from `globals.css`.
- **Lucide React** for icons — consistent icon library.

### Step 4: Build + Verify
```bash
pnpm run build    # Must pass
pnpm run start    # Visual check in production
```

---

## Design Decision Tree

```
What type of visual change?
│
├─ New Component
│  Is there an existing Shadcn primitive? → USE IT
│  Does a similar pattern exist in components/? → EXTEND IT
│  Truly new? → Create in appropriate subdirectory
│  Will it be used in 2+ places? → Put in components/ui/
│
├─ Layout Change
│  CHECK: app/layout.tsx (global layout, nav, theme)
│  CHECK: app/page.tsx (section ordering)
│  Section-specific? → components/sections/{section}.tsx
│  Global? → layout.tsx or globals.css
│
├─ Animation
│  Simple enter/exit? → Framer Motion AnimatePresence
│  Scroll-triggered? → AOS (already installed) or Framer Motion whileInView
│  Continuous? → Framer Motion animate with repeat
│  Chat typing? → components/ai-chat/ (existing patterns)
│
├─ Theme / Color
│  CHECK: app/globals.css → CSS custom properties
│  CHECK: components/theme-provider.tsx → next-themes config
│  Dark mode? → Use Tailwind dark: prefix with CSS variables
│  Brand color? → Update CSS variables, not individual components
│
├─ Responsive
│  Mobile-first approach with Tailwind breakpoints
│  sm: → md: → lg: → xl:
│  CHECK: existing responsive patterns in components/sections/
│
├─ Chat UI
│  CHECK: components/ai-chat/ (8 components)
│  Mood-based colors? → Purple (GenZ), Blue (Professional)
│  Sidebar layout? → chat-sidebar.tsx
│  Message bubbles? → chat-message.tsx
│  Input area? → chat-input.tsx
│
└─ Typography
   Use Tailwind typography utilities
   Font: Inter (configured in layout.tsx)
   Heading hierarchy: consistent across sections
```

---

## Styling Conventions

### Color System
- Use CSS custom properties defined in `globals.css`
- Dark mode via `dark:` Tailwind prefix
- Mood colors: `purple-*` (GenZ), `blue-*` (Professional)
- Never hardcode hex values in components — use Tailwind classes

### Spacing
- Consistent section padding: use existing section component patterns
- Card spacing: follow existing `components/ui/card.tsx` patterns
- Mobile: reduce padding proportionally with Tailwind responsive

### Shadows & Borders
- Follow Shadcn defaults for elevation
- Use `rounded-*` Tailwind classes consistently
- Border colors from theme variables

### Animation Guidelines
- **Enter:** fade + slide (Framer Motion `initial` → `animate`)
- **Exit:** fade out (AnimatePresence with `exit` prop)
- **Hover:** scale or color shift (Tailwind `hover:` or Framer `whileHover`)
- **Duration:** 200-300ms for micro-interactions, 500ms for page transitions
- **Easing:** `ease-out` for enters, `ease-in` for exits

---

## Anti-Patterns

| Don't | Do instead |
|-------|-----------|
| Create custom button styles | Use `components/ui/button.tsx` variants |
| Use CSS modules or styled-components | Tailwind CSS classes only |
| Hardcode colors | Use CSS variables / Tailwind theme |
| Animate with raw CSS `@keyframes` | Framer Motion for interactive elements |
| Skip dark mode support | Always add `dark:` variants |
| Create one-off card designs | Extend `components/ui/card.tsx` |
| Ignore mobile viewport | Mobile-first responsive design |
| Mix icon libraries | Lucide React only |
