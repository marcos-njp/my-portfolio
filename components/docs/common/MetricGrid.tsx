interface MetricCardProps {
  label: string;
  value: string | number;
  description?: string;
  className?: string;
}

export function MetricCard({ label, value, description, className = "" }: MetricCardProps) {
  return (
    <div className={`rounded-md border border-border bg-card p-4 ${className}`}>
      <p className="nm-label-sm mb-2">{label}</p>
      <p className="text-2xl font-medium tracking-tight tabular-nums">{value}</p>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}

interface MetricGridProps {
  metrics: MetricCardProps[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function MetricGrid({ metrics, columns = 3, className = "" }: MetricGridProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "sm:grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  return (
    <div className={`grid gap-3 text-sm ${gridCols[columns]} ${className}`}>
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}
