export interface Project {
  title: string
  description: string
  image: string
  githubLink: string
  liveLink?: string
  tags: string[]
}

export const projects: Project[] = [
  {
    title: "Person Search",
    description: "OAuth-secured Next.js 15 application with Google authentication, Prisma ORM, and PostgreSQL. Features protected routes, database-backed CRUD operations, and comprehensive security documentation.",
    image: "https://v1.screenshot.11ty.dev/https%3A%2F%2Fperson-search-marcos-njp.vercel.app/opengraph/",
    githubLink: "https://github.com/marcos-njp/person-search",
    liveLink: "https://person-search-marcos-njp.vercel.app",
    tags: ["Next.js 15", "OAuth", "Prisma", "PostgreSQL", "TypeScript"]
  },
  {
    title: "My CV",
    description: "Modern, responsive portfolio website showcasing work, skills, and experience. Features dark/light mode, smooth animations, and optimized performance built with Next.js 15.",
    image: "https://v1.screenshot.11ty.dev/https%3A%2F%2Fmy-cv-marcos-njp.vercel.app/opengraph/",
    githubLink: "https://github.com/marcos-njp/my-cv",
    liveLink: "https://my-cv-marcos-njp.vercel.app",
    tags: ["Next.js 15", "TypeScript", "Framer Motion", "Tailwind CSS"]
  }
]
