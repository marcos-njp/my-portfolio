import { ReactNode } from "react";

interface StarCardProps {
  letter: "S" | "T" | "A" | "R";
  title: string;
  children: ReactNode;
}

export function StarCard({ letter, title, children }: StarCardProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full border border-foreground flex items-center justify-center flex-shrink-0">
        <span className="nm-display text-sm leading-none">{letter}</span>
      </div>
      <div className="flex-1">
        <h3 className="font-medium mb-1">{title}</h3>
        <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
