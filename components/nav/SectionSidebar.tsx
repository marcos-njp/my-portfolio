"use client";

// components/nav/SectionSidebar.tsx
//
// The desktop section sidebar, shared by `/docs` and `/data-analyst-sandbox`.
// This is the former `DocsSidebar` body with its two hardcoded pieces lifted
// into props: the heading text and the link list. Markup and class strings are
// unchanged, so `/docs` renders byte-identically through the thin wrapper that
// remains at `components/docs/DocsSidebar.tsx`.
//
// Lives in `components/nav/` rather than under `components/data-analyst-sandbox/`
// on purpose: the index numerals use the `.nm-display` face, and
// `components/data-analyst-sandbox/data-profiler/__tests__/design-system.test.ts` asserts
// that no component in that folder uses it outside the two approved numerals.

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { isSectionActive, type SectionNavItem } from "@/components/nav/section-nav";

export interface SectionSidebarProps {
  /** The `nm-label` heading above the list, e.g. "Documentation". */
  label: string;
  items: readonly SectionNavItem[];
  backHref?: string;
  backLabel?: string;
  /**
   * Route-specific controls rendered under the link list.
   *
   * The profiler puts its "Ask Digital Nino" trigger here. It cannot be a nav
   * item: it opens a dialog owned by the page, not a destination, and the page
   * holds the state it needs. The page portals into this slot instead, which is
   * why the container renders even when empty.
   */
  children?: ReactNode;
}

export function SectionSidebar({
  label,
  items,
  backHref = "/",
  backLabel = "Back to portfolio",
  children,
}: SectionSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const section = searchParams.get("section");

  return (
    <nav className="space-y-0.5 py-6">
      <p className="nm-label px-3 mb-3">{label}</p>
      {items.map((item) => {
        const isActive = isSectionActive(item.href, pathname, section);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md border transition-colors ${
              isActive
                ? "border-border bg-secondary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <span className="nm-display text-muted-foreground text-base w-7 text-right leading-none">{item.index}</span>
            <span>{item.name}</span>
          </Link>
        );
      })}

      {children === undefined ? null : (
        <div className="mt-4 border-t border-border pt-4">{children}</div>
      )}

      <div className="pt-4 mt-4 border-t border-border">
        <Link href={backHref} className="nm-label flex items-center gap-2 px-3 py-2 hover:text-foreground transition-colors">
          {backLabel}
        </Link>
      </div>
    </nav>
  );
}
