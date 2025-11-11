import TimelineCard from "@/components/ui/timeline-card"
import { GraduationCap } from "lucide-react"

const education = [
  {
    school: "St. Paul University Philippines",
    degree: "Bachelor of Science in Information Technology",
    period: "2023 - Present",
    location: "Tuguegarao City, Philippines",
    description: "Currently pursuing degree in Information Technology"
  },
  {
    school: "St. Paul University Philippines",
    degree: "Basic Education",
    period: "2016 - 2023",
    location: "Tuguegarao City, Philippines",
    description: "Completed Basic Education with competition experience on Robotics VEX IQ using Python programming"
  }
]

export default function EducationSection() {
  return (
    <div className="space-y-3">
      {education.map((edu, index) => (
        <TimelineCard
          key={index}
          icon={GraduationCap}
          title={edu.school}
          subtitle={`${edu.degree} • ${edu.location}`}
          period={edu.period}
          description={edu.description}
        />
      ))}
    </div>
  )
}
