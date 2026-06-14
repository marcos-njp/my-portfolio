import { ReactNode } from "react";

interface DocPageLayoutProps {
  title: string;
  subtitle: string;
  index?: string;
  children: ReactNode;
}

export function DocPageLayout({ title, subtitle, index, children }: DocPageLayoutProps) {
  return (
    <div className="space-y-10">
      <header className="border-b border-border pb-6">
        <div className="flex items-center gap-3">
          {index && <span className="nm-display text-primary text-xl leading-none">{index}</span>}
          <span className="nm-label">how I built it</span>
        </div>
        <h1 className="mt-3 text-3xl md:text-4xl font-medium tracking-tight">{title}</h1>
        <p className="mt-2 text-base text-muted-foreground max-w-2xl leading-relaxed">{subtitle}</p>
      </header>
      {children}
    </div>
  );
}
