import { ReactNode } from "react";
import { Check, X } from "lucide-react";

interface ComparisonCardProps {
  title: string;
  type?: "before" | "after";
  items: string[] | ReactNode[];
  className?: string;
}

export function ComparisonCard({ title, type = "before", items, className = "" }: ComparisonCardProps) {
  const isAfter = type === "after";

  return (
    // Full border around the entire card — no single-side accent border.
    <div className={`rounded-md border ${isAfter ? "border-foreground" : "border-line-strong"} bg-card p-4 ${className}`}>
      <h4 className="font-medium mb-3 text-sm flex items-center gap-2">
        {isAfter ? <Check className="w-4 h-4" strokeWidth={2} /> : <X className="w-4 h-4 text-primary" strokeWidth={2} />}
        {title}
      </h4>
      <ul className="space-y-1.5 text-xs text-muted-foreground">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className={`font-mono mt-px ${isAfter ? "text-foreground" : "text-primary"}`}>{isAfter ? "+" : "−"}</span>
            {typeof item === "string" ? item : <div>{item}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ComparisonGridProps {
  before: Omit<ComparisonCardProps, "type">;
  after: Omit<ComparisonCardProps, "type">;
  className?: string;
}

export function ComparisonGrid({ before, after, className = "" }: ComparisonGridProps) {
  return (
    <div className={`grid md:grid-cols-2 gap-4 ${className}`}>
      <ComparisonCard {...before} type="before" />
      <ComparisonCard {...after} type="after" />
    </div>
  );
}
