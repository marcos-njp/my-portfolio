"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, X, FileText, Cpu, Zap, Plug, TestTube, AlertCircle, Github, Database } from "lucide-react";

const navigation = [
  { name: "Overview", href: "/docs", icon: FileText },
  { name: "RAG Architecture", href: "/docs?section=rag-architecture", icon: Cpu },
  { name: "Advanced Features", href: "/docs?section=advanced-features", icon: Zap },
  { name: "MCP Integration", href: "/docs?section=mcp-integration", icon: Plug },
  { name: "Testing & Evolution", href: "/docs?section=testing", icon: TestTube },
  { name: "Operations", href: "/docs?section=operations", icon: AlertCircle },
  { name: "GitHub Repositories", href: "/docs?section=github", icon: Github },
  { name: "Profile Data", href: "/docs?section=profile-data", icon: Database },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const section = searchParams.get("section");

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 hover:bg-muted rounded-md transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <nav className="fixed top-14 left-0 right-0 bg-background border-b z-50 md:hidden max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <div className="px-4 py-4 space-y-1">
              <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Documentation
              </p>
              {navigation.map((item) => {
                const Icon = item.icon;
                const itemSection = new URLSearchParams(item.href.split("?")[1]).get("section");
                const isActive = (pathname === "/docs" && !section && !itemSection) || 
                                  (section && section === itemSection);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 text-sm rounded-md transition-colors ${
                      isActive 
                        ? "bg-primary text-primary-foreground font-medium" 
                        : "hover:bg-muted active:bg-muted"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "" : "text-muted-foreground"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              <div className="pt-4 mt-4 border-t">
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back to Portfolio
                </Link>
              </div>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
