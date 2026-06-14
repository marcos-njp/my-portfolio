"use client"

import { useEffect, useState } from "react"

export function PhilippineTime() {
  const [time, setTime] = useState("")

  useEffect(() => {
    const update = () =>
      setTime(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Manila",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date())
      )
    update()
    const id = setInterval(update, 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <p className="text-sm font-medium">
      <span className="nm-display tabular-nums">{time || "--:--"}</span>{" "}
      <span className="text-muted-foreground">GMT+8</span>
    </p>
  )
}
