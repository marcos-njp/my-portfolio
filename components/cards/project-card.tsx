"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Image from "next/image"

interface ProjectCardProps {
  title: string
  description: string
  image: string
  tags: string[]
  onClick: () => void
}

export default function ProjectCard({ title, description, image, tags, onClick }: ProjectCardProps) {
  return (
    <Card 
      className="h-full overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 group border-2"
      onClick={onClick}
    >
      <div className="relative aspect-video bg-muted">
        <Image
          src={image || "/placeholder.svg"}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <CardContent className="p-5">
        <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">{description}</p>
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20"
            >
              {tag}
            </span>
          ))}
          {tags.length > 4 && (
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              +{tags.length - 4}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-5 pt-0">
        <Button variant="ghost" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          View Details
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </CardFooter>
    </Card>
  )
}
