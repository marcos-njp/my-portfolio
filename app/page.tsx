import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import ContactForm from "@/components/forms/contact-form"
import TechStack from "@/components/sections/tech-stack"
import HeroSection from "@/components/sections/hero-section"
import ProjectsSection from "@/components/sections/projects-section"
import ExperienceSection from "@/components/sections/experience-section"
import EducationSection from "@/components/sections/education-section"

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      {/* Minimalist Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link className="flex items-center" href="/">
              <span className="font-semibold text-base">m-njp</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#about" className="text-xs font-medium transition-colors hover:text-primary">
                About
              </Link>
              <Link href="#ai-chat" className="text-xs font-medium transition-colors hover:text-primary">
                AI Chat
              </Link>
              <Link href="#skills" className="text-xs font-medium transition-colors hover:text-primary">
                Skills
              </Link>
              <Link href="#projects" className="text-xs font-medium transition-colors hover:text-primary">
                Projects
              </Link>
              <Link href="#experience" className="text-xs font-medium transition-colors hover:text-primary">
                Experience
              </Link>
              <Link href="#education" className="text-xs font-medium transition-colors hover:text-primary">
                Education
              </Link>
              <Link href="#contact" className="text-xs font-medium transition-colors hover:text-primary">
                Contact
              </Link>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {/* Hero / About Section */}
        <HeroSection />

        {/* Divider */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="border-t" />
        </div>

        {/* AI Chat Coming Soon Section */}
        <section id="ai-chat" className="py-12 md:py-16">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="relative overflow-hidden rounded-lg border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8 md:p-10">
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                    Coming Soon
                  </span>
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                    AI Chat Assistant
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
                    Soon you'll be able to chat with an AI assistant that knows all about my projects, skills, and experience. 
                    Ask questions, get detailed explanations, or just have a conversation about my work!
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center">
                        <span className="text-xs">🤖</span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-accent/20 border-2 border-background flex items-center justify-center">
                        <span className="text-xs">💬</span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center">
                        <span className="text-xs">✨</span>
                      </div>
                    </div>
                    <span>Powered by AI • Interactive • Available 24/7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="border-t" />
        </div>

        {/* Skills Section */}
        <section id="skills" className="py-12 md:py-16">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                  Skills & Expertise
                </h2>
                <p className="text-sm text-muted-foreground">
                  Technologies and tools I work with
                </p>
              </div>
              <TechStack />
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="border-t" />
        </div>

        {/* Projects Section */}
        <ProjectsSection />

        {/* Divider */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="border-t" />
        </div>

        {/* Experience Section */}
        <section id="experience" className="py-12 md:py-16">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                  Experience & Competitions
                </h2>
                <p className="text-sm text-muted-foreground">
                  Academic background and competition achievements
                </p>
              </div>
              <ExperienceSection />
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="border-t" />
        </div>

        {/* Education Section */}
        <section id="education" className="py-12 md:py-16">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                  Education
                </h2>
                <p className="text-sm text-muted-foreground">
                  Academic background and qualifications
                </p>
              </div>
              <EducationSection />
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="border-t" />
        </div>

        {/* Contact Section */}
        <section id="contact" className="py-12 md:py-16">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8 text-center">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                  Get in Touch
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Send me an email and I'll get back to you soon
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link href="https://github.com/marcos-njp" target="_blank" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </Link>
                  <span className="text-muted-foreground/30">•</span>
                  <Link href="https://www.linkedin.com/in/niño-marcos/" target="_blank" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </Link>
                </div>
              </div>
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      {/* Minimalist Footer */}
      <footer className="border-t mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs text-muted-foreground text-center">
              Built with Next.js 15, React, and Tailwind CSS • Deployed on Vercel
            </p>
            <p className="text-xs text-muted-foreground">
              © 2024 Niño Marcos. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
