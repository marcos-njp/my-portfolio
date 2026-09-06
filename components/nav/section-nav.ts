// components/nav/section-nav.ts
//
// The shape and the active-state rule shared by every section sidebar on the
// site. Extracted from `components/docs/nav-items.ts`, which kept both the docs
// link list and the matching rule in one file and so could not be reused by the
// sandbox without dragging the documentation links along with it.
//
// The data stays with each section (`components/docs/nav-items.ts`,
// `components/data-analyst-sandbox/nav-items.ts`); only the type and the rule live here.

/** One entry in a section sidebar: a two-digit numeral, a label and a target. */
export interface SectionNavItem {
  index: string;
  name: string;
  href: string;
}

/**
 * True when `href` names the page currently on screen.
 *
 * Two navigation styles are supported because the site uses both. Docs entries
 * are query-param routes off a single pathname (`/docs?section=lib-utilities`),
 * so the section is what distinguishes them. Sandbox entries are real
 * pathnames with no query at all. Splitting the href once and comparing both
 * halves covers each without the caller having to say which style it is using.
 *
 * The pathname comparison is new relative to the docs-only version, which
 * matched on the section alone. It is a no-op there (every docs entry shares the
 * `/docs` pathname) and it is what stops a sandbox route from matching a
 * same-named section elsewhere.
 */
export function isSectionActive(
  href: string,
  pathname: string,
  section: string | null,
): boolean {
  const [itemPath, itemQuery] = href.split("?");
  const itemSection = new URLSearchParams(itemQuery ?? "").get("section");

  if (itemSection) {
    return pathname === itemPath && section === itemSection;
  }
  return pathname === itemPath && !section;
}
