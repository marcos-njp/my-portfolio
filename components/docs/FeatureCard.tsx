import { ReactNode } from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  items?: string[];
  children?: ReactNode;
  variant?: 'default' | 'bordered';
}

export function FeatureCard({ 
  title, 
  description, 
  icon, 
  items, 
  children,
  variant = 'default' 
}: FeatureCardProps) {
  const baseStyles = variant === 'bordered' 
    ? 'rounded-lg border-2 p-6'
    : 'rounded-lg border bg-card p-6';

  return (
    <div className={baseStyles}>
      <div className="flex items-start gap-3 mb-3">
        {icon && <div className="text-2xl">{icon}</div>}
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      
      {items && items.length > 0 && (
        <ul className="space-y-2 mt-4">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
      
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
