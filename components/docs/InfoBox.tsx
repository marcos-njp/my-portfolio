import { ReactNode } from "react";

interface InfoBoxProps {
  children: ReactNode;
  variant?: "default" | "muted";
}

export function InfoBox({ children, variant = "default" }: InfoBoxProps) {
  return (
    <div className={`rounded-lg border p-6 ${variant === "muted" ? "bg-muted/50" : ""}`}>
      <div className="text-sm">{children}</div>
    </div>
  );
}
