import { ReactNode } from "react";

interface CodeBlockProps {
  code?: string;
  children?: ReactNode;
  language?: string;
  filename?: string;
}

export function CodeBlock({ code, children, language = "typescript", filename }: CodeBlockProps) {
  const content = code || children;
  
  return (
    <div className="rounded-lg border bg-muted/50 overflow-hidden">
      {filename && (
        <div className="px-4 py-2 bg-muted border-b text-xs text-muted-foreground">
          {filename}
        </div>
      )}
      <pre className="p-4 overflow-x-auto">
        <code className={`language-${language} text-sm`}>{content}</code>
      </pre>
    </div>
  );
}
