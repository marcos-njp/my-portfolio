"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef, useState, useEffect } from "react"

interface HorizontalScrollProps {
  children: React.ReactNode
}

export default function HorizontalScroll({ children }: HorizontalScrollProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener("resize", checkScroll)
    return () => window.removeEventListener("resize", checkScroll)
  }, [])

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const cardWidth = 400 + 24 // card width + gap
      const currentScroll = scrollContainerRef.current.scrollLeft
      const targetScroll = direction === "left" 
        ? Math.max(0, currentScroll - cardWidth)
        : currentScroll + cardWidth

      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      })
    }
  }

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scrollContainerRef.current) {
      setIsDragging(true)
      setStartX(e.pageX - scrollContainerRef.current.offsetLeft)
      setScrollLeft(scrollContainerRef.current.scrollLeft)
      scrollContainerRef.current.style.cursor = "grabbing"
      scrollContainerRef.current.style.userSelect = "none"
    }
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
      if (scrollContainerRef.current) {
        scrollContainerRef.current.style.cursor = "grab"
        scrollContainerRef.current.style.userSelect = "auto"
      }
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = "grab"
      scrollContainerRef.current.style.userSelect = "auto"
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollContainerRef.current.offsetLeft
    const walk = (x - startX) * 2 // Scroll speed multiplier
    scrollContainerRef.current.scrollLeft = scrollLeft - walk
  }

  return (
    <div className="relative group">
      {/* Left gradient overlay */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
      )}
      
      {canScrollLeft && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full shadow-lg bg-background/95 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}
      
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 cursor-grab active:cursor-grabbing"
        style={{ 
          scrollbarWidth: "none", 
          msOverflowStyle: "none",
          scrollSnapType: "x mandatory"
        }}
      >
        {children}
      </div>

      {/* Right gradient overlay */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />
      )}

      {canScrollRight && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full shadow-lg bg-background/95 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </div>
  )
}
