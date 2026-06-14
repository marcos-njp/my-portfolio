import { ThemeProvider } from "@/components/ui/theme-provider"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import type React from "react"

// Body — Inter
const inter = localFont({
  src: [
    { path: "../public/fonts/Inter-Light.otf", weight: "300", style: "normal" },
    { path: "../public/fonts/Inter-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/Inter-Medium.otf", weight: "500", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
})

// Headings — NType82 (Nothing's grotesk)
const ntype = localFont({
  src: [
    { path: "../public/fonts/NType82-Regular.otf", weight: "500", style: "normal" },
    { path: "../public/fonts/NType82-Headline.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-ntype",
  display: "swap",
})

// Display only — Ndot dot-matrix (numerals, glyph, indices)
const ndot = localFont({
  src: "../public/fonts/Ndot-55.otf",
  variable: "--font-ndot",
  display: "swap",
})

// Mono — LetteraMono (labels, code)
const lettera = localFont({
  src: [
    { path: "../public/fonts/LetteraMonoLL-Light.otf", weight: "300", style: "normal" },
    { path: "../public/fonts/LetteraMonoLL-Regular.otf", weight: "400", style: "normal" },
    { path: "../public/fonts/LetteraMonoLL-Medium.otf", weight: "500", style: "normal" },
    { path: "../public/fonts/LetteraMonoLL-Italic.otf", weight: "400", style: "italic" },
  ],
  variable: "--font-lettera",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Niño Justin Marcos · Agentic AI Developer",
  description: "Portfolio and AI digital twin of Niño Justin Marcos. Agentic AI development, automation, and project management.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background text-foreground antialiased font-sans",
          inter.variable,
          ntype.variable,
          ndot.variable,
          lettera.variable
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
