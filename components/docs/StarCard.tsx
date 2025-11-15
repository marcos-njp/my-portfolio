import { ReactNode } from "react";

interface StarCardProps {
  letter: "S" | "T" | "A" | "R";
  title: string;
  children: ReactNode;
}

const starColors = {
  S: { border: "border-blue-500", bg: "bg-blue-50 dark:bg-blue-950", text: "text-blue-700 dark:text-blue-300" },
  T: { border: "border-purple-500", bg: "bg-purple-50 dark:bg-purple-950", text: "text-purple-700 dark:text-purple-300" },
  A: { border: "border-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950", text: "text-emerald-700 dark:text-emerald-300" },
  R: { border: "border-amber-500", bg: "bg-amber-50 dark:bg-amber-950", text: "text-amber-700 dark:text-amber-300" },
};

export function StarCard({ letter, title, children }: StarCardProps) {
  const colors = starColors[letter];
  
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-full border-2 ${colors.border} ${colors.bg} flex items-center justify-center flex-shrink-0`}>
        <span className={`${colors.text} font-semibold text-sm`}>{letter}</span>
      </div>
      <div className="flex-1">
        <h3 className="font-semibold mb-1">{title}</h3>
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
