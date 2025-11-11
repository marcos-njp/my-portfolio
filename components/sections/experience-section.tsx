import TimelineCard from "@/components/ui/timeline-card"
import { Briefcase, Trophy } from "lucide-react"

const experiences = [
  {
    type: "education",
    title: "IT Student",
    organization: "School of Information Techonology and Engineering",
    period: "Present",
    description: "Pursuing Bachelor of Science in Information Technology with focus on Web Development",
    icon: Briefcase
  },
  {
    type: "competition",
    title: "4th Place - Programming Skills Excellence",
    organization: "STEAM International Challenge 2018 (Competition)",
    period: "November 2018",
    location: "Shenzhen, China",
    description: "International Robotics Competition - Represented Team Philippines among 118 teams from 5 countries",
    icon: Trophy
  },
  {
    type: "competition",
    title: "5th Place - Excellence Award",
    organization: "6th Robothon National Competition (Competition)",
    period: "October 2018",
    location: "Quezon City, Philippines",
    description: "National Robotics Competition - Represented St. Paul University Philippines among 43 schools",
    icon: Trophy
  }
]

export default function ExperienceSection() {
  return (
    <div className="space-y-3">
      {experiences.map((exp, index) => (
        <TimelineCard
          key={index}
          icon={exp.icon}
          title={exp.title}
          subtitle={`${exp.organization}${exp.location ? ` • ${exp.location}` : ''}`}
          period={exp.period}
          description={exp.description}
        />
      ))}
    </div>
  )
}
