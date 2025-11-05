import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Github, Linkedin, Mail, Twitter, Download } from "lucide-react"
import Link from "next/link"
import ContactForm from "./components/contact-form"
import CreativeWork from "./components/creative-work"
import HorizontalScroll from "./components/horizontal-scroll"
import ProjectCard from "./components/project-card"
import TechStack from "./components/tech-stack"

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link className="flex items-center space-x-2" href="/">
                <span className="font-bold text-xl">John.dev</span>
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link href="#about" className="text-sm font-medium transition-colors hover:text-primary">
                  About
                </Link>
                <Link href="#projects" className="text-sm font-medium transition-colors hover:text-primary">
                  Projects
                </Link>
                <Link href="#creative" className="text-sm font-medium transition-colors hover:text-primary">
                  Creative
                </Link>
                <Link href="#contact" className="text-sm font-medium transition-colors hover:text-primary">
                  Contact
                </Link>
                <Link href="#ai-chat" className="text-sm font-medium transition-colors hover:text-primary">
                  AI Chat
                </Link>
              </nav>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main>
        <section id="about" className="relative py-12 md:py-24 lg:py-32 overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            {/* Mobile: Photo First */}
            <div className="flex justify-center mb-8 md:hidden">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-2xl"></div>
                <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                  <div className="w-full h-full rounded-3xl bg-gradient-to-br from-muted to-muted/50 border-2 border-border/50 overflow-hidden shadow-2xl backdrop-blur-sm">
                    {/* Placeholder for your photo - replace with <Image /> component */}
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent"></div>
                      <span className="text-xs font-medium z-10">Your Photo Here</span>
                    </div>
                  </div>
                  {/* Floating accent elements */}
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/30 rounded-2xl blur-xl animate-pulse"></div>
                  <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-accent/40 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-center">
              {/* Content - Left Side */}
              <div className="md:col-span-7 space-y-6 md:space-y-8">
                <div className="space-y-4 md:space-y-6">
                  <div className="inline-block">
                    <span className="text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Welcome to my portfolio
                    </span>
                  </div>
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
                    Full Stack
                    <br />
                    <span className="text-primary">Developer</span>
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-[600px] leading-relaxed">
                    Building digital experiences with modern technologies. Focused on creating elegant solutions to
                    complex problems.
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <Link href="https://github.com" target="_blank">
                    <Button variant="outline" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 hover:scale-110 transition-transform">
                      <Github className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="sr-only">GitHub</span>
                    </Button>
                  </Link>
                  <Link href="https://linkedin.com" target="_blank">
                    <Button variant="outline" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 hover:scale-110 transition-transform">
                      <Linkedin className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="sr-only">LinkedIn</span>
                    </Button>
                  </Link>
                  <Link href="https://twitter.com" target="_blank">
                    <Button variant="outline" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 hover:scale-110 transition-transform">
                      <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="sr-only">Twitter</span>
                    </Button>
                  </Link>
                  <Link href="mailto:hello@example.com">
                    <Button variant="outline" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 hover:scale-110 transition-transform">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="sr-only">Email</span>
                    </Button>
                  </Link>
                </div>
                
                <Button size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-shadow">
                  <Download className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Download Resume
                </Button>
              </div>
              
              {/* Photo - Right Side (Desktop Only) */}
              <div className="hidden md:flex md:col-span-5 justify-center md:justify-end">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-300"></div>
                  <div className="relative w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96">
                    <div className="w-full h-full rounded-3xl bg-gradient-to-br from-muted to-muted/50 border-2 border-border/50 overflow-hidden shadow-2xl backdrop-blur-sm">
                      {/* Placeholder for your photo - replace with <Image /> component */}
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent"></div>
                        <span className="text-sm font-medium z-10">Your Photo Here</span>
                      </div>
                    </div>
                    {/* Floating accent elements */}
                    <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary/30 rounded-2xl blur-xl animate-pulse"></div>
                    <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-accent/40 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="projects" className="py-12 md:py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-12 text-center">Projects</h2>
            <HorizontalScroll>
              <div className="flex gap-6 min-w-full">
                <div className="min-w-[350px] md:min-w-[400px] scroll-snap-align-start">
                  <ProjectCard
                    title="E-commerce Platform"
                    description="A full-stack e-commerce platform built with Next.js, Prisma, and Stripe integration."
                    image="/placeholder.svg?height=400&width=600"
                    link="https://github.com"
                    tags={["Next.js", "Prisma", "Stripe"]}
                  />
                </div>
                <div className="min-w-[350px] md:min-w-[400px] scroll-snap-align-start">
                  <ProjectCard
                    title="Task Management App"
                    description="A real-time task management application with team collaboration features."
                    image="/placeholder.svg?height=400&width=600"
                    link="https://github.com"
                    tags={["React", "Node.js", "Socket.io"]}
                  />
                </div>
                <div className="min-w-[350px] md:min-w-[400px] scroll-snap-align-start">
                  <ProjectCard
                    title="AI Chat Interface"
                    description="An AI-powered chat interface with natural language processing capabilities."
                    image="/placeholder.svg?height=400&width=600"
                    link="https://github.com"
                    tags={["OpenAI", "Next.js", "TailwindCSS"]}
                  />
                </div>
                <div className="min-w-[350px] md:min-w-[400px] scroll-snap-align-start">
                  <ProjectCard
                    title="Portfolio Website"
                    description="A modern portfolio website with interactive UI and smooth animations."
                    image="/placeholder.svg?height=400&width=600"
                    link="https://github.com"
                    tags={["Next.js", "Tailwind", "Framer Motion"]}
                  />
                </div>
              </div>
            </HorizontalScroll>
          </div>
        </section>

        <section className="py-12 md:py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-12 text-center">
              Tech Stack
            </h2>
            <TechStack />
          </div>
        </section>

        <section id="creative" className="py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-12 text-center">
              Creative Work
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Explore my design projects including Photoshop edits, graphic design, and visual creations.
            </p>
            <HorizontalScroll>
              <CreativeWork />
            </HorizontalScroll>
          </div>
        </section>

        <section id="ai-chat" className="py-12 md:py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6">
                AI Assistant
              </h2>
              <p className="text-muted-foreground mb-8">
                Chat with an AI assistant to learn more about my work, skills, and experience.
              </p>
              <div className="rounded-lg border bg-card p-8 shadow-sm">
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  <p className="text-sm">AI Chat feature coming soon...</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="py-12 md:py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-12 text-center">
                Get in Touch
              </h2>
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-2 sm:flex-row items-center">
            <p className="text-xs text-muted-foreground">© 2024 John.dev. All rights reserved.</p>
            <nav className="sm:ml-auto flex gap-4 sm:gap-6">
              <Link className="text-xs hover:underline underline-offset-4" href="#">
                Terms of Service
              </Link>
              <Link className="text-xs hover:underline underline-offset-4" href="#">
                Privacy
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
