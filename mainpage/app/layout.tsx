import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Somove — The Open-Source Platform for Body-Based Therapy",
  description:
    "Run your practice from anywhere. Scheduling, full-body video with gesture controls, payments, messaging — purpose-built for somatic therapists, yoga teachers, and movement professionals.",
  icons: {
    icon: "/crest.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Lora:wght@400;500&display=swap"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
