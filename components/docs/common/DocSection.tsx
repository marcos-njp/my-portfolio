import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface DocSectionProps {
  title?: string;
  subtitle?: string;
  /** Accepted for compatibility but no longer rendered — section headers are icon-free. */
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function DocSection({ title, subtitle, children, className = "" }: DocSectionProps) {
  return (
    <section className={`space-y-4 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-2">
          {title && <h2 className="text-xl md:text-2xl font-medium tracking-tight">{title}</h2>}
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
