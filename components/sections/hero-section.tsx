"use client"

import Image from "next/image"
import Link from "next/link"
import { Github, Linkedin, Mail, ArrowUpRight } from "lucide-react"

const LINKS = [
  { href: "https://github.com/drSabine", label: "Github", icon: Github },
  { href: "https://www.linkedin.com/in/niño-marcos/", label: "LinkedIn", icon: Linkedin },
]

export default function HeroSection() {
  return (
    <section id="about" className="relative overflow-hidden">
      <div className="absolute inset-0 dot-grid-fine dark:dot-grid-fine-red opacity-50 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid md:grid-cols-[1fr_240px] gap-10 md:gap-14 items-center">
          {/* Identity */}
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <span className="nm-led nm-led-blink" />
              <span className="nm-label-hero">Agentic AI Developer, Automation and Project Management</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight leading-[0.95] text-balance">
              Niño Justin Marcos
            </h1>

            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-md leading-relaxed font-body">
              Building automation and AI systems, with a close eye on the details.
            </p>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {LINKS.map(({ href, label, icon: Icon }) => (
                <Link key={label} href={href} target="_blank" rel="noopener noreferrer" className="nm-link nm-hover">
                  <Icon className="w-3.5 h-3.5" /> {label} <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              ))}
              <Link href="mailto:justinpmarcos@gmail.com" className="nm-link nm-link-accent">
                <Mail className="w-3.5 h-3.5" /> Email <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Portrait */}
          <div className="relative w-44 md:w-full max-w-[240px] mx-auto aspect-[4/5] nm-panel">
            <Image
              src="/images/profile-photo.jpg"
              alt="Niño Justin Marcos"
              fill
              className="object-cover"
              priority
            />
            {/* Corner marks in red (visible in both modes) */}
            <span className="pointer-events-none absolute -top-px -left-px w-3 h-3 border-t border-l border-primary" />
            <span className="pointer-events-none absolute -top-px -right-px w-3 h-3 border-t border-r border-primary" />
            <span className="pointer-events-none absolute -bottom-px -left-px w-3 h-3 border-b border-l border-primary" />
            <span className="pointer-events-none absolute -bottom-px -right-px w-3 h-3 border-b border-r border-primary" />
            <span className="absolute bottom-0 inset-x-0 bg-background/85 backdrop-blur-sm border-t border-border py-1.5 text-center nm-label-sm">
              ID 001
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
