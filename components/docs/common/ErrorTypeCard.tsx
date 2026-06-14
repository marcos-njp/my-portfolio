interface ErrorTypeCardProps {
  title: string;
  professional: string;
  genz: string;
}

export function ErrorTypeCard({ title, professional, genz }: ErrorTypeCardProps) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <h4 className="font-medium text-sm mb-3">{title}</h4>
      <div className="grid md:grid-cols-2 gap-3 text-xs">
        <div className="border border-border rounded p-3 bg-secondary">
          <p className="nm-label-sm mb-1.5">professional</p>
          <p className="text-muted-foreground leading-relaxed">&ldquo;{professional}&rdquo;</p>
        </div>
        <div className="border border-border rounded p-3 bg-secondary">
          <p className="nm-label-sm mb-1.5">gen-z</p>
          <p className="text-muted-foreground leading-relaxed">&ldquo;{genz}&rdquo;</p>
        </div>
      </div>
    </div>
  );
}
