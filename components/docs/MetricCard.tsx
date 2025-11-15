interface MetricCardProps {
  label: string;
  value: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning';
}

export function MetricCard({ label, value, description, variant = 'default' }: MetricCardProps) {
  const variantStyles = {
    default: 'border-border',
    success: 'border-green-500/20 bg-green-500/5',
    warning: 'border-amber-500/20 bg-amber-500/5'
  };

  return (
    <div className={`rounded-lg border p-4 ${variantStyles[variant]}`}>
      <div className="text-sm text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <div className="text-xs text-muted-foreground mt-2">{description}</div>
      )}
    </div>
  );
}
