"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, X } from "lucide-react";
import { docsNav, isDocActive } from "@/components/docs/nav-items";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const section = searchParams.get("section");

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden inline-flex items-center justify-center w-9 h-9 border border-border rounded-md hover:border-foreground transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsOpen(false)} />
          <nav className="fixed top-14 left-0 right-0 bg-background border-b border-border z-50 md:hidden max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <div className="px-4 py-4 space-y-0.5">
              <p className="nm-label px-3 mb-2">Documentation</p>
              {docsNav.map((item) => {
                const isActive = isDocActive(item.href, pathname, section);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 text-sm rounded-md border transition-colors ${
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
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className="nm-label flex items-center gap-2 px-3 py-3 hover:text-foreground transition-colors"
                >
                  Back to portfolio
                </Link>
              </div>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
