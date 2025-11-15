"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FileText, Cpu, Zap, Plug, TestTube, AlertCircle, Github, Database, LucideIcon } from "lucide-react";

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

export function DocsSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const section = searchParams.get("section");

  return (
    <aside className="hidden md:block w-64 flex-shrink-0">
      <nav className="sticky top-20 space-y-1">
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
              className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                isActive 
                  ? "bg-primary text-primary-foreground font-medium" 
                  : "hover:bg-muted"
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
            className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Portfolio
          </Link>
        </div>
      </nav>
    </aside>
  );
}
