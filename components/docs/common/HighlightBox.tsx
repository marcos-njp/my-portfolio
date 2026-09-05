import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

type HighlightType = "info" | "tip" | "warning" | "note" | "success";

interface HighlightBoxProps {
  type?: HighlightType;
  icon?: LucideIcon;
  title?: string;
  children: ReactNode;
  className?: string;
}

// Full border — color applied uniformly around the box, not just left side.
const accent: Record<HighlightType, string> = {
  info: "border-line-strong",
  tip: "border-foreground",
  warning: "border-primary",
  note: "border-line-strong",
  success: "border-foreground",
};

export function HighlightBox({ type = "note", icon: Icon, title, children, className = "" }: HighlightBoxProps) {
  return (
    <div className={`rounded-md border ${accent[type]} bg-card p-3 ${className}`}>
      <div className="flex items-start gap-2">
        {Icon && <Icon className="w-4 h-4 mt-0.5 text-foreground shrink-0" strokeWidth={1.75} />}
        <div className="flex-1">
          {title && <p className="font-medium text-sm mb-1">{title}</p>}
          <div className="text-xs text-muted-foreground leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}
