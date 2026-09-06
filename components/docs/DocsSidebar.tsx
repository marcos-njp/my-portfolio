"use client";

// components/docs/DocsSidebar.tsx
//
// The docs binding of the shared `SectionSidebar`. The markup used to live here;
// it moved to `components/nav/SectionSidebar.tsx` when the sandbox needed the
// same sidebar with a different list. This file stays so every existing import
// of `DocsSidebar` keeps working and the docs link list keeps one owner.

import { SectionSidebar } from "@/components/nav/SectionSidebar";
import { docsNav } from "@/components/docs/nav-items";

export function DocsSidebar() {
  return <SectionSidebar label="Documentation" items={docsNav} />;
}
