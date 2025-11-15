interface SectionHeaderProps {
  title: string;
  description?: string;
  id?: string;
}

export function SectionHeader({ title, description, id }: SectionHeaderProps) {
  return (
    <div className="mb-6" id={id}>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
