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
    <div className="rounded-lg border p-6">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
        <div>
          <h3 className="font-semibold">{problem}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="rounded-md bg-muted p-4">
          <p className="font-medium mb-2">Diagnosis:</p>
          {Array.isArray(diagnosis) ? (
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {diagnosis.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          ) : (
            diagnosis
          )}
        </div>

        <div className="rounded-md bg-green-50 dark:bg-green-950 p-4">
          <p className="font-medium text-green-700 dark:text-green-300 mb-2">Solution:</p>
          {typeof solution === "string" ? (
            <p className="text-xs text-green-600 dark:text-green-400">{solution}</p>
          ) : (
            solution
          )}
        </div>

        <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-4">
          <p className="font-medium text-blue-700 dark:text-blue-300 mb-2">Prevention:</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">{prevention}</p>
        </div>
      </div>
    </div>
  );
}
