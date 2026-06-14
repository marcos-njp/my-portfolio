import { PhilippineTime } from "@/components/data/philippine-time"
import { Mail, Linkedin, Github, Clock, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { SectionHeader } from "@/components/sections/section-header"

const CONTACTS = [
  { icon: Mail, label: "Email", value: "justinpmarcos@gmail.com", href: "mailto:justinpmarcos@gmail.com" },
  { icon: Linkedin, label: "LinkedIn", value: "Connect with me", href: "https://www.linkedin.com/in/niño-marcos/" },
  { icon: Github, label: "GitHub", value: "@marcos-njp", href: "https://github.com/marcos-njp" },
]

export default function ContactSection() {
  return (
    <section id="contact" className="py-14 md:py-20 border-t border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          index="04"
          title="Get in Touch"
          subtitle="Based in the Philippines. Open to opportunities and freelance work."
        />

        <div className="grid gap-px bg-border border border-border sm:grid-cols-2 lg:grid-cols-4">
          {CONTACTS.map(({ icon: Icon, label, value, href }) => (
            <Link
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="bg-background p-6 group transition-colors hover:bg-secondary"
            >
              <div className="flex items-center justify-between mb-6">
                <Icon className="w-5 h-5" strokeWidth={1.5} />
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <p className="nm-label mb-1.5">{label}</p>
              <p className="text-sm font-medium break-words">{value}</p>
            </Link>
          ))}

          <div className="bg-background p-6">
            <div className="flex items-center justify-between mb-6">
              <Clock className="w-5 h-5" strokeWidth={1.5} />
              <span className="nm-led nm-led-blink" />
            </div>
            <p className="nm-label mb-1.5">Local Time</p>
            <PhilippineTime />
          </div>
        </div>
      </div>
    </section>
  )
}
