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
                  Experience
                </h2>
                <p className="text-sm text-muted-foreground">
                  Professional background and achievements
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
                <p className="text-sm text-muted-foreground">
                  Send me an email and I'll get back to you soon
                </p>
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
