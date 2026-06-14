import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface DocSectionProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function DocSection({ title, subtitle, icon: Icon, children, className = "" }: DocSectionProps) {
  return (
    <section className={`space-y-4 ${className}`}>
      {(title || subtitle || Icon) && (
        <div className="flex items-center gap-3 mb-2">
          {Icon && <Icon className="w-5 h-5 text-foreground" strokeWidth={1.5} />}
          <div>
            {title && <h2 className="text-xl md:text-2xl font-medium tracking-tight">{title}</h2>}
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </section>
  );
}
