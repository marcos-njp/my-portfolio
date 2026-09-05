interface SectionHeaderProps {
  index: string
  title: string
  subtitle?: string
}

/** Shared section header: Ndot index, hairline rule, grotesk title. */
export function SectionHeader({ index, title, subtitle }: SectionHeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex items-center gap-3">
        <span className="nm-display text-muted-foreground text-lg md:text-xl leading-none">{index}</span>
        <span className="flex-1 h-px bg-border" />
      </div>
      <h2 className="mt-4 text-3xl md:text-4xl font-medium tracking-tight">{title}</h2>
      {subtitle && <p className="mt-2.5 text-sm text-muted-foreground max-w-xl leading-relaxed">{subtitle}</p>}
    </header>
  )
}
