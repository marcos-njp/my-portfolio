import { Card } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface TimelineCardProps {
  icon: LucideIcon
  title: string
  subtitle: string
  period: string
  description: string
}

export default function TimelineCard({
  icon: Icon,
  title,
  subtitle,
  period,
  description,
}: TimelineCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-base font-semibold leading-tight">{title}</h3>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{period}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{subtitle}</p>
          <p className="text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </Card>
  )
}
