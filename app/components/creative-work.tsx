import { Card } from "@/components/ui/card"
import Image from "next/image"

interface CreativeWorkProps {
  title: string
  description: string
  image: string
  category: string
}

const creativeWorks: CreativeWorkProps[] = [
  {
    title: "Brand Identity Design",
    description: "Modern brand identity with vibrant colors and clean typography",
    image: "/placeholder.svg?height=400&width=600",
    category: "Graphic Design",
  },
  {
    title: "Photo Manipulation",
    description: "Creative photo manipulation and compositing work",
    image: "/placeholder.svg?height=400&width=600",
    category: "Photoshop",
  },
  {
    title: "UI/UX Mockups",
    description: "Mobile app interface design with modern aesthetics",
    image: "/placeholder.svg?height=400&width=600",
    category: "UI/UX Design",
  },
]

export default function CreativeWork() {
  return (
    <div className="flex gap-6">
      {creativeWorks.map((work) => (
        <Card key={work.title} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow min-w-[350px] md:min-w-[400px] flex-shrink-0 scroll-snap-align-start">
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={work.image}
              alt={work.title}
              fill
              className="object-cover transition-transform group-hover:scale-110"
            />
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center rounded-full bg-background/90 px-3 py-1 text-xs font-medium">
                {work.category}
              </span>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2">{work.title}</h3>
            <p className="text-sm text-muted-foreground">{work.description}</p>
          </div>
        </Card>
      ))}
    </div>
  )
}
