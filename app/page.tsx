"use client"

import { useState } from "react"
import Header from "@/components/sections/header"
import Footer from "@/components/sections/footer"
import HeroSection from "@/components/sections/hero-section"
import AiChatSection from "@/components/sections/ai-chat-section"
import ApproachSection from "@/components/sections/approach-section"
import ExperienceSection from "@/components/sections/experience-section"
import EducationSection from "@/components/sections/education-section"
import ContactSection from "@/components/sections/contact-section"
import IntroScreen from "@/components/sections/intro-screen"
import { SectionHeader } from "@/components/sections/section-header"

function Section({
  id,
  index,
  title,
  subtitle,
  children,
}: {
  id: string
  index: string
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="py-14 md:py-20 border-t border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader index={index} title={title} subtitle={subtitle} />
        {children}
      </div>
    </section>
  )
}

export default function Page() {
  const [started, setStarted] = useState(false)

  if (!started) {
    return <IntroScreen onStart={() => setStarted(true)} />
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <AiChatSection />
        <ApproachSection />
        <Section id="experience" index="02" title="Experience">
          <ExperienceSection />
        </Section>
        <Section id="education" index="03" title="Education">
          <EducationSection />
        </Section>
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}
