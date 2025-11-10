import { Button } from "@/components/ui/button"
import { Github, Linkedin, Mail } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function HeroSection() {
  return (
    <section id="about" className="relative py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Photo - Compact Size */}
          <div className="flex-shrink-0">
            <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-border/50 shadow-sm">
              <Image
                src="/images/profile-photo.jpg"
                alt="Niño Marcos"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                Niño Marcos
              </h1>
              <p className="text-sm text-muted-foreground">
                Full Stack Developer
              </p>
            </div>

            <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
              Building digital experiences with modern technologies. Focused on creating elegant solutions to
              complex problems.
            </p>

            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <Link href="https://github.com/marcos-njp" target="_blank">
                <Button variant="outline" size="sm" className="h-8 px-3">
                  <Github className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs">GitHub</span>
                </Button>
              </Link>
              <Link href="https://www.linkedin.com/in/niño-marcos/" target="_blank">
                <Button variant="outline" size="sm" className="h-8 px-3">
                  <Linkedin className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs">LinkedIn</span>
                </Button>
              </Link>
              <Link href="mailto:justinpmarcos@gmail.com">
                <Button variant="outline" size="sm" className="h-8 px-3">
                  <Mail className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs">Email</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
