import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

type AlertType = "info" | "warning" | "success" | "error";

interface AlertBoxProps {
  type?: AlertType;
  icon?: LucideIcon;
  title?: string;
  children: ReactNode;
  className?: string;
}

// Full border — color applied uniformly around the box, not just left side.
const accent: Record<AlertType, string> = {
  info: "border-line-strong",
  warning: "border-primary",
  success: "border-foreground",
  error: "border-primary",
};

export function AlertBox({ type = "info", icon: Icon, title, children, className = "" }: AlertBoxProps) {
  return (
    <div className={`rounded-md border ${accent[type]} bg-card p-5 ${className}`}>
      <div className="flex items-start gap-3">
        {Icon && <Icon className="w-4 h-4 mt-0.5 text-foreground shrink-0" strokeWidth={1.75} />}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="nm-label-sm">{type}</span>
          </div>
          {title && <h3 className="font-medium text-sm mb-1">{title}</h3>}
          <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}
