import { Card } from "@/components/ui/card"
import { Briefcase, Trophy } from "lucide-react"

const experiences = [
  {
    type: "education",
    title: "IT Student",
    organization: "Current Institution",
    period: "Present",
    description: "Pursuing Bachelor of Science in Information Technology with focus on full-stack development",
    icon: Briefcase
  },
  {
    type: "competition",
    title: "4th Place - Programming Skills Excellence",
    organization: "STEAM International Challenge 2018 (Competition)",
    period: "November 2018",
    location: "Shenzhen, China",
    description: "International robotics competition - Represented Team Philippines among 118 teams from 5 countries",
    icon: Trophy
  },
  {
    type: "competition",
    title: "5th Place - Excellence Award",
    organization: "6th Robothon National Competition (Competition)",
    period: "October 2018",
    location: "Quezon City, Philippines",
    description: "National robotics competition - Represented St. Paul University Philippines among 43 schools",
    icon: Trophy
  }
]

export default function ExperienceSection() {
  return (
    <div className="space-y-3">
      {experiences.map((exp, index) => {
        const Icon = exp.icon
        return (
          <Card key={index} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-base font-semibold leading-tight">{exp.title}</h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{exp.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {exp.organization}
                  {exp.location && ` • ${exp.location}`}
                </p>
                <p className="text-sm leading-relaxed">{exp.description}</p>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
