import { Card } from "@/components/ui/card"
import { GraduationCap } from "lucide-react"

const education = [
  {
    school: "St. Paul University Philippines",
    degree: "Basic Education",
    period: "2006 - 2018",
    location: "Tuguegarao City, Philippines",
    description: "Completed basic education with focus on robotics and computer programming"
  },
  {
    school: "Your Current University",
    degree: "Bachelor's Degree",
    period: "Year - Present",
    location: "City, Country",
    description: "Currently pursuing degree in Computer Science or related field"
  }
]

export default function EducationSection() {
  return (
    <div className="space-y-3">
      {education.map((edu, index) => (
        <Card key={index} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-base font-semibold leading-tight">{edu.school}</h3>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{edu.period}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {edu.degree} • {edu.location}
              </p>
              <p className="text-sm leading-relaxed">{edu.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
