import Link from "next/link"
import { Github, Linkedin, ArrowUpRight } from "lucide-react"
import { SectionHeader } from "@/components/sections/section-header"

const FOCUS = ["React", "Next.js", "TypeScript", "Flutter", "Agentic AI", "Automation", "Firebase", "Tailwind"]

const WORKFLOW = [
  { tool: "Claude", use: "Structuring and building" },
  { tool: "GPT models", use: "Gathering context" },
  { tool: "Gemini", use: "Design evaluation" },
]

export default function ApproachSection() {
  return (
    <section id="approach" className="py-14 md:py-20 border-t border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader index="01" title="How I work and what I care about" />

        <div className="max-w-2xl space-y-4">
          <p className="text-lg md:text-xl leading-relaxed">
            I care about getting the details right. I would rather catch an inconsistency early than patch
            around it later.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            I don&apos;t just vibecode a quick fix. I get the full context first, write the docs and the pointers,
            then build on a foundation I actually understand. I live by DRY: write it once, reuse it everywhere,
            and keep the system clean.
          </p>
        </div>

        {/* How I work with AI */}
        <div className="mt-8">
          <p className="nm-label-sm mb-3">How I work with AI</p>
          <div className="grid gap-px bg-border border border-border sm:grid-cols-3">
            {WORKFLOW.map((w) => (
              <div key={w.tool} className="bg-background p-4">
                <p className="font-medium">{w.tool}</p>
                <p className="text-sm text-muted-foreground mt-1">{w.use}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            I build my own agents and subagents, then orchestrate them. The models do the legwork; the judgment stays mine.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {FOCUS.map((t) => (
            <span
              key={t}
              className="font-mono text-[11px] tracking-tight text-muted-foreground border border-border rounded-sm px-3 py-1.5"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-10 nm-panel p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h3 className="text-lg font-medium tracking-tight">Curious what I&apos;m building?</h3>
            <p className="text-sm text-muted-foreground mt-1">My latest work lives on GitHub. Let&apos;s connect on LinkedIn.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link href="https://github.com/drSabine" target="_blank" rel="noopener noreferrer" className="nm-link nm-hover">
              <Github className="w-3.5 h-3.5" /> GitHub <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <Link href="https://www.linkedin.com/in/niño-marcos/" target="_blank" rel="noopener noreferrer" className="nm-link nm-link-accent">
              <Linkedin className="w-3.5 h-3.5" /> LinkedIn <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
