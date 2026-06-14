import { ReactNode } from "react";

interface CodeBlockProps {
  children: ReactNode;
  title?: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ children, title, language = "typescript", className = "" }: CodeBlockProps) {
  return (
    <div className={`rounded-md border border-border bg-card overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary">
        <span className="nm-label-sm">{title || "code"}</span>
        <span className="nm-label-sm">{language}</span>
      </div>
      <pre className="text-xs overflow-x-auto p-4 font-mono leading-relaxed text-foreground">
        <code className={`language-${language}`}>{children}</code>
      </pre>
    </div>
  );
}
