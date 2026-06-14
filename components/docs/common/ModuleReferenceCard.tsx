interface ModuleReferenceCardProps {
  name: string;
  purpose: string;
  exports: string;
  prefix?: string;
}

export function ModuleReferenceCard({ name, purpose, exports, prefix = "lib/" }: ModuleReferenceCardProps) {
  return (
    <div className="rounded-md border border-border bg-card p-4 nm-hover min-w-0 h-full">
      <div className="flex justify-between items-start gap-2 mb-2">
        <h4 className="font-mono text-sm font-medium break-all">{name}</h4>
        <span className="nm-label-sm border border-border rounded px-1.5 py-0.5">{prefix}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{purpose}</p>
      <code className="block w-full break-all text-xs font-mono bg-secondary border border-border rounded px-2 py-1">{exports}</code>
    </div>
  );
}
