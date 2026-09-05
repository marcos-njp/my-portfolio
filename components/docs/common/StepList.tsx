import { ReactNode } from "react";

interface StepListProps {
  steps: Array<{
    number?: string | number;
    title: string;
    description?: string;
    content?: ReactNode;
  }>;
  className?: string;
}

export function StepList({ steps, className = "" }: StepListProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className="rounded-sm border border-foreground w-6 h-6 flex items-center justify-center flex-shrink-0">
            <span className="nm-display text-xs leading-none">{step.number ?? index + 1}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{step.title}</p>
            {step.description && <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>}
            {step.content && <div className="mt-2">{step.content}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
