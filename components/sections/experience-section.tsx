import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

interface ExperienceLink {
  label: string
  href: string
}

interface Experience {
  period: string
  label: string
  accent?: boolean
  title: string
  organization: string
  location?: string
  description: string
  image?: string
  imageAlt?: string
  imageFit?: "cover" | "contain"
  links?: ExperienceLink[]
}

const experiences: Experience[] = [
  {
    period: "Since Sep 2024",
    label: "Organization",
    accent: true,
    title: "Vice President of External Affairs",
    organization: "Junior Philippine Computer Society · SPUP Chapter",
    location: "St. Paul University Philippines",
    description:
      "I lead external affairs for the student developer community, handling partnerships, sponsorships, and outreach with organizations beyond the campus.",
    links: [{ label: "JPCS SPUP", href: "https://www.facebook.com/SPUPJPCSofficial" }],
  },
  {
    period: "Sep to Dec 2025",
    label: "Internship",
    title: "Fullstack & Agentic AI Developer",
    organization: "Industry Project Internship · Employability Advantage",
    location: "with AusBiz Consulting (Australia)",
    description:
      "A 10-week hands-on industry engagement building production fullstack and agentic AI features, mentored by industry experts. Worked through real project requirements end to end, from setup to delivery.",
    links: [
      { label: "Verify credential", href: "https://www.credential.net/1d20c9dd-811a-4fa9-9e6d-66dbda7969d8" },
      { label: "Certificate", href: "/pdf/statement-of-completion.pdf" },
    ],
  },
  {
    period: "2025",
    label: "Competition",
    title: "Semi-Finalist · Group Stage 4",
    organization: "CodeChum National Programming Challenge 2025, Season 2",
    description:
      "Advanced to the semi-finals of a national competitive programming challenge, solving timed algorithmic problems against teams across the country.",
    image: "/images/codechum-m-njp.png",
    imageAlt: "CodeChum National Programming Challenge 2025 certificate",
    imageFit: "contain",
    links: [{ label: "View certificate", href: "https://app.codechum.com/certificates/19945" }],
  },
  {
    period: "Nov 2018",
    label: "International",
    title: "Programming Skills Excellence · 4th of 118 teams",
    organization: "2018 STEAM International Challenge (国际挑战赛), Robotics",
    location: "Shenzhen, Guangdong, China",
    description:
      "Represented Team Philippines at 14 years old. The time-attack event was co-organized by the Hong Kong Vocational Technical School and joined by 118 teams from China, Indonesia, the Philippines, Thailand, South Korea, and Vietnam, across three subcategories: Physical Programming, Virtual Programming, and VEX IQ Controller Teamwork.",
    image: "/images/main-pic-china-robotics-intl-competition.jpg",
    imageAlt: "STEAM International Challenge 2018 in Shenzhen, China",
    imageFit: "cover",
  },
  {
    period: "Oct 2018",
    label: "National",
    title: "Excellence Award · 5th of 43 schools",
    organization: "6th Robothon National Competition",
    location: "Trinity University of Asia, Quezon City",
    description:
      "Represented the St. Paul University Philippines Basic Education Unit Robotics Team at 14, competing against 43 schools nationwide in robotics programming challenges.",
    image: "/images/trinity-univ-of-asia-natl-competition.jpg",
    imageAlt: "6th Robothon National Competition at Trinity University of Asia",
    imageFit: "cover",
  },
]

export default function ExperienceSection() {
  return (
    <div className="border-t border-border">
      {experiences.map((exp, i) => (
        <div key={i} className="grid md:grid-cols-[150px_1fr] gap-3 md:gap-6 py-7 border-b border-border">
          <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-2.5">
            <span className="nm-label">{exp.period}</span>
            <span
              className={`nm-label-sm rounded-full px-2.5 py-1 border ${
                exp.accent ? "text-primary border-primary" : "text-muted-foreground border-border"
              }`}
            >
              {exp.label}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-medium tracking-tight">{exp.title}</h3>
            <p className="mt-1.5 nm-label">
              {exp.organization}
              {exp.location ? ` · ${exp.location}` : ""}
            </p>
            <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed max-w-2xl">{exp.description}</p>

            {exp.image && (
              <div className="mt-4 relative w-full max-w-md aspect-[16/10] nm-panel overflow-hidden">
                <Image
                  src={exp.image}
                  alt={exp.imageAlt ?? exp.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 448px"
                  className={exp.imageFit === "contain" ? "object-contain p-3 bg-card" : "object-cover"}
                />
              </div>
            )}

            {exp.links && exp.links.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2.5">
                {exp.links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nm-link nm-hover"
                  >
                    {l.label} <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
