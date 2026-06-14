import { AlertTriangle } from "lucide-react";
import { ReactNode } from "react";

interface TroubleshootCardProps {
  problem: string;
  description: string;
  diagnosis: string[] | ReactNode;
  solution: string | ReactNode;
  prevention: string;
}

export function TroubleshootCard({ problem, description, diagnosis, solution, prevention }: TroubleshootCardProps) {
  return (
    <div className="rounded-md border border-border bg-card p-6">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-5 h-5 text-primary mt-0.5 shrink-0" strokeWidth={1.75} />
        <div>
          <h3 className="font-medium">{problem}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="rounded-md border border-border bg-secondary p-4">
          <p className="nm-label-sm mb-2">diagnosis</p>
          {Array.isArray(diagnosis) ? (
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {diagnosis.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            diagnosis
          )}
        </div>

        {/* Full border — foreground color on all sides, not just left */}
        <div className="rounded-md border-2 border-foreground bg-card p-4">
          <p className="nm-label-sm mb-2">solution</p>
          {typeof solution === "string" ? <p className="text-xs text-muted-foreground leading-relaxed">{solution}</p> : solution}
        </div>

        {/* Full border — line-strong color on all sides */}
        <div className="rounded-md border-2 border-line-strong bg-card p-4">
          <p className="nm-label-sm mb-2">prevention</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{prevention}</p>
        </div>
      </div>
    </div>
  );
}
