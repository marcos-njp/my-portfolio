import Link from "next/link";
import { Github, ArrowUpRight } from "lucide-react";

interface GithubProjectCardProps {
  name: string;
  description: string;
  tech: string[];
  github: string;
  demo: string | null;
  highlights: string[];
}

export function GithubProjectCard({ name, description, tech, github, demo, highlights }: GithubProjectCardProps) {
  return (
    <div className="rounded-md border border-border bg-card p-6 nm-hover">
      <div className="mb-4">
        <h3 className="text-xl font-medium tracking-tight mb-2">{name}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>

      <div className="mb-4">
        <p className="nm-label-sm mb-2">tech stack</p>
        <div className="flex flex-wrap gap-2">
          {tech.map((t, i) => (
            <span key={i} className="font-mono text-[11px] tracking-wide border border-border rounded-sm px-2.5 py-1 text-muted-foreground">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="nm-label-sm mb-2">key features</p>
        <ul className="grid md:grid-cols-2 gap-2 text-sm">
          {highlights.map((highlight, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary font-mono mt-px">+</span>
              <span className="text-muted-foreground">{highlight}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2.5 mt-5 pt-4 border-t border-border">
        <Link href={github} target="_blank" rel="noopener noreferrer" className="nm-link nm-hover">
          <Github className="w-3.5 h-3.5" /> view code <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
        {demo && (
          <Link href={demo} target="_blank" rel="noopener noreferrer" className="nm-link nm-link-accent">
            live demo <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
