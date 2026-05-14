import type React from "react"
import type { Metadata } from "next"
import { DM_Sans, Lora } from "next/font/google"
import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
})

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  weight: ["400", "500"],
  display: "swap",
  preload: true,
})

export const metadata: Metadata = {
  title: "Somove — The Open-Source Platform for Body-Based Therapy",
  description:
    "Run your practice from anywhere. Scheduling, full-body video with gesture controls, payments, messaging — purpose-built for somatic therapists, yoga teachers, and movement professionals.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${lora.variable} antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500&display=swap" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
