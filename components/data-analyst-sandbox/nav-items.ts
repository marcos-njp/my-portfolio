// components/data-analyst-sandbox/nav-items.ts
//
// Single source of truth for the Data Analyst Sandbox sidebar, mirroring
// `components/docs/nav-items.ts`.
//
// Deliberately outside `components/data-analyst-sandbox/data-profiler/`: the
// sidebar renders these `index` values in the `.nm-display` face, and the
// design-system source scan in that folder asserts the face is used only by
// the parse percentage and the quality score.
import type { SectionNavItem } from "@/components/nav/section-nav"

export const sandboxNav = [
  { index: "00", name: "Data Profiler", href: "/data-analyst-sandbox/data-profiler" },
  { index: "01", name: "How it works", href: "/data-analyst-sandbox/data-profiler/how-it-works" },
] as const satisfies readonly SectionNavItem[]
