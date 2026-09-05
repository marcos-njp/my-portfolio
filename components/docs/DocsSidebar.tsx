"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { docsNav, isDocActive } from "@/components/docs/nav-items";

export function DocsSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const section = searchParams.get("section");

  return (
    <nav className="space-y-0.5 py-6">
      <p className="nm-label px-3 mb-3">Documentation</p>
      {docsNav.map((item) => {
        const isActive = isDocActive(item.href, pathname, section);
        return (
          <Link
            key={item.href}
            href={item.href}
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

      <div className="pt-4 mt-4 border-t border-border">
        <Link href="/" className="nm-label flex items-center gap-2 px-3 py-2 hover:text-foreground transition-colors">
          Back to portfolio
        </Link>
      </div>
    </nav>
  );
}
