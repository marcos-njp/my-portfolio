"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Github, ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Project } from "@/lib/projects-data"

interface ProjectModalProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ProjectModal({ project, open, onOpenChange }: ProjectModalProps) {
  if (!project) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{project.title}</DialogTitle>
          <DialogDescription className="text-base mt-2">
            {project.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Project Image */}
          <div className="relative aspect-video rounded-lg overflow-hidden border">
            <Image
              src={project.image}
              alt={project.title}
              fill
              className="object-cover"
            />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary border border-primary/20"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-3 pt-4">
            <Link href={project.githubLink} target="_blank" className="flex-1 min-w-[200px]">
              <Button variant="outline" className="w-full">
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </Button>
            </Link>
            {project.liveLink && (
              <Link href={project.liveLink} target="_blank" className="flex-1 min-w-[200px]">
                <Button className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Live Demo
                </Button>
              </Link>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
