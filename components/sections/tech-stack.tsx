import { Card } from "@/components/ui/card"

const skills = [
  {
    category: "Languages",
    items: ["JavaScript", "TypeScript", "Python", "Java", "C++", "PHP"],
  },
  {
    category: "Frontend",
    items: ["React", "Next.js", "TailwindCSS", "HTML/CSS", "Framer Motion"],
  },
  {
    category: "Backend",
    items: ["Node.js", "Express", "PostgreSQL", "Prisma", "REST APIs"],
  },
  {
    category: "Tools & Others",
    items: ["Git", "VS Code", "Vercel", "Docker", "Linux"],
  },
]

export default function TechStack() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {skills.map((skillGroup, index) => (
        <Card key={index} className="p-5 hover:shadow-md transition-all hover:border-primary/20">
          <h3 className="text-sm font-semibold mb-3 text-primary">{skillGroup.category}</h3>
          <div className="flex flex-wrap gap-2">
            {skillGroup.items.map((skill, skillIndex) => (
              <span
                key={skillIndex}
                className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium hover:bg-primary/10 transition-colors cursor-default"
              >
                {skill}
              </span>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}
