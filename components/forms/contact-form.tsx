"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { submitContactForm } from "@/app/actions"

export default function ContactForm() {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")

  async function handleSubmit(formData: FormData) {
    setPending(true)
    try {
      const response = await submitContactForm(formData)
      setMessage(response.message)
    } catch (error) {
      setMessage("Something went wrong. Please try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="p-5 max-w-lg mx-auto">
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1.5">
            Name
          </label>
          <Input id="name" name="name" placeholder="Your name" required className="h-9" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">
            Email
          </label>
          <Input id="email" name="email" type="email" placeholder="your.email@example.com" required className="h-9" />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1.5">
            Message
          </label>
          <Textarea id="message" name="message" placeholder="Your message..." required className="min-h-[100px] resize-none" />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Sending..." : "Send Message"}
        </Button>
        {message && (
          <p className={`text-sm text-center mt-3 ${message.includes("Thanks") ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
            {message}
          </p>
        )}
      </form>
    </Card>
  )
}
