"use client";

// components/docs/common/MobileNav.tsx
//
// The docs binding of the shared `MobileSectionNav`. See the note in
// `components/docs/DocsSidebar.tsx`: the markup moved to `components/nav/` so
// the sandbox could reuse it with its own link list.

import { MobileSectionNav } from "@/components/nav/MobileSectionNav";
import { docsNav } from "@/components/docs/nav-items";

export function MobileNav() {
  return <MobileSectionNav label="Documentation" items={docsNav} />;
}
