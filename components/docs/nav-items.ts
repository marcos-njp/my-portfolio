// Single source of truth for the docs navigation (used by sidebar + mobile nav).
export const docsNav = [
  { index: "00", name: "Overview", href: "/docs" },
  { index: "01", name: "Retrieval & Response Flow", href: "/docs?section=rag-architecture" },
  { index: "02", name: "Lib Utilities", href: "/docs?section=lib-utilities" },
  { index: "03", name: "Personality System", href: "/docs?section=personality-system" },
  { index: "04", name: "Advanced Features", href: "/docs?section=advanced-features" },
  { index: "05", name: "MCP Integration", href: "/docs?section=mcp-integration" },
  { index: "06", name: "GitHub Repositories", href: "/docs?section=github" },
  { index: "07", name: "Profile Data", href: "/docs?section=profile-data" },
  { index: "08", name: "Companion & Prompt Flow", href: "/docs?section=companion-processing" },
] as const

/** True when the given nav href matches the current pathname + ?section. */
export function isDocActive(href: string, pathname: string, section: string | null) {
  const itemSection = new URLSearchParams(href.split("?")[1] ?? "").get("section")
  return (pathname === "/docs" && !section && !itemSection) || (!!section && section === itemSection)
}
