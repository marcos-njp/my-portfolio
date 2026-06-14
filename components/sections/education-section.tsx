import Image from "next/image"

const education = [
  {
    school: "St. Paul University Philippines",
    degree: "Bachelor of Science in Information Technology",
    period: "2023 to Present",
    location: "Tuguegarao City, Philippines",
    description: "Currently pursuing a degree in Information Technology.",
    logo: "/images/SPUP-final-logo.png",
  },
  {
    school: "St. Paul University Philippines",
    degree: "Basic Education",
    period: "2016 to 2023",
    location: "Tuguegarao City, Philippines",
    description: "Completed Basic Education with competition experience in Robotics VEX IQ using Python.",
    logo: "/images/SPUP-final-logo.png",
  },
]

export default function EducationSection() {
  return (
    <div className="border-t border-border">
      {education.map((edu, i) => (
        <div key={i} className="flex items-start gap-5 py-7 border-b border-border">
          <div className="flex-shrink-0 w-14 h-14 nm-panel bg-white flex items-center justify-center p-1.5">
            <Image src={edu.logo} alt={`${edu.school} logo`} width={44} height={44} className="object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-medium tracking-tight">{edu.school}</h3>
              <span className="nm-label whitespace-nowrap">{edu.period}</span>
            </div>
            <p className="mt-1.5 nm-label">
              {edu.degree} · {edu.location}
            </p>
            <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed max-w-2xl">{edu.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
