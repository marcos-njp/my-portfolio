import { Suspense } from "react";
import DocsContent from "./content";

export default function DocsPage() {
  return (
    <Suspense fallback={<div className="space-y-4"><div className="h-8 bg-muted animate-pulse rounded" /><div className="h-64 bg-muted animate-pulse rounded" /></div>}>
      <DocsContent />
    </Suspense>
  );
}
