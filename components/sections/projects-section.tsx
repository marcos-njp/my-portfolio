"use client"

import { useState } from "react"
import ProjectCard from "@/components/cards/project-card"
import ProjectModal from "@/components/modals/project-modal"
import { projects, type Project } from "@/lib/projects-data"

export default function ProjectsSection() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project)
    setModalOpen(true)
  }

  return (
    <section id="projects" className="py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
            Featured Projects
          </h2>
          <p className="text-sm text-muted-foreground">
            Click on any project to see more details
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project, index) => (
            <ProjectCard
              key={index}
              title={project.title}
              description={project.description}
              image={project.image}
              tags={project.tags}
              onClick={() => handleProjectClick(project)}
            />
          ))}
        </div>
      </div>

      <ProjectModal
        project={selectedProject}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </section>
  )
}
