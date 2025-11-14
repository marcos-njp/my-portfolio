"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Code2, Film } from "lucide-react"
import Image from "next/image"

interface ProjectCardProps {
  title: string
  description: string
  image: string
  tags: string[]
  onClick: () => void
}

export default function ProjectCard({ title, description, image, tags, onClick }: ProjectCardProps) {
  const isPlaceholder = image.includes('placeholder')
  const Icon = image.includes('mcp') ? Code2 : Film
  
  return (
    <Card 
      className="h-full overflow-hidden cursor-pointer transition-all hover:shadow-lg border group"
      onClick={onClick}
    >
      <div className="relative aspect-video bg-muted">
        {isPlaceholder ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Icon className="h-20 w-20 text-primary/40" />
          </div>
        ) : (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
          />
        )}
      </div>
      <CardContent className="p-3.5 space-y-2.5">
        <h3 className="font-bold text-base leading-tight">{title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary ring-1 ring-inset ring-primary/20"
            >
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              +{tags.length - 3}
            </span>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs h-8 hover:bg-primary hover:text-primary-foreground transition-colors group-hover:bg-primary/10 dark:group-hover:bg-primary/20 dark:text-foreground dark:hover:text-primary-foreground"
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
        >
          View Details
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  )
}
