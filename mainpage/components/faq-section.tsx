"use client"

import { useState } from "react"

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: "What is Somove and who is it for?",
    answer:
      "Somove is an open-source practice management platform built for somatic therapists, yoga teachers, dance therapists, psychologists, and any professional offering remote sessions involving movement or body-based work. It handles scheduling, video calls with gesture controls, payments, messaging, and client management.",
  },
  {
    question: "How do the gesture controls work during video sessions?",
    answer:
      "Somove uses MediaPipe Hands for browser-side gesture recognition. During a video session, you can toggle gesture controls on to manage your session hands-free — thumbs up to zoom in, open palm to zoom out, wave to mute/unmute, and a held fist to toggle your camera. No extra hardware needed, works with any webcam.",
  },
  {
    question: "Can I self-host Somove for free?",
    answer:
      "Yes. Somove is open-source (AGPL-3.0). Click 'Deploy to Vercel' in our README, connect your Supabase project (free tier, EU region), and add your API keys for Daily.co, Cal.com, Stripe, and Resend — all of which have free tiers. The total cost to run your practice can be €0/month.",
  },
  {
    question: "Is client data secure and GDPR compliant?",
    answer:
      "All data is hosted in EU data centers (Supabase Frankfurt, Daily.co EU, Vercel EU edge). Sensitive fields like intake data, session notes, and messages are encrypted at rest. Somove includes consent logging, cookie consent, and privacy policy pages. Right to erasure and data portability are supported.",
  },
  {
    question: "What video platform does Somove use?",
    answer:
      "Somove uses Daily.co for WebRTC video, which supports EU data centers and has GDPR DPA coverage. Unlike standard telehealth platforms designed for face-only calls, Somove's video is optimized for full-body observation — essential for somatic therapy, yoga, and movement-based sessions.",
  },
  {
    question: "How do payments work?",
    answer:
      "Somove integrates with Stripe Checkout for session payments. Clients pay at the time of booking. You can offer a free first consultation as a toggle. The system handles refunds based on your cancellation policy. Revenue is tracked in your therapist dashboard.",
  },
]

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  return (
    <div className="w-full flex justify-center items-start">
      <div className="flex-1 px-4 md:px-12 py-16 md:py-20 flex flex-col lg:flex-row justify-start items-start gap-6 lg:gap-12">
        {/* Left Column - Header */}
        <div className="w-full lg:flex-1 flex flex-col justify-center items-start gap-4 lg:py-5">
          <div className="w-full flex flex-col justify-center text-[#2D2A26] font-semibold leading-tight md:leading-[44px] font-sans text-4xl tracking-tight">
            Frequently Asked Questions
          </div>
          <div className="w-full text-[#9A9590] text-base font-normal leading-7 font-sans">
            Everything you need to know about
            <br className="hidden md:block" />
            running your practice on Somove.
          </div>
        </div>

        {/* Right Column - FAQ Items */}
        <div className="w-full lg:flex-1 flex flex-col justify-center items-center">
          <div className="w-full flex flex-col">
            {faqData.map((item, index) => {
              const isOpen = openItems.includes(index)

              return (
                <div key={index} className="w-full border-b border-[rgba(73,66,61,0.16)] overflow-hidden">
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full px-5 py-[18px] flex justify-between items-center gap-5 text-left hover:bg-[rgba(73,66,61,0.02)] transition-colors duration-200"
                    aria-expanded={isOpen}
                  >
                    <div className="flex-1 text-[#2D2A26] text-base font-medium leading-6 font-sans">
                      {item.question}
                    </div>
                    <div className="flex justify-center items-center">
                      <ChevronDownIcon
                        className={`w-6 h-6 text-[rgba(73,66,61,0.60)] transition-transform duration-300 ease-in-out ${
                          isOpen ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-5 pb-[18px] text-[#9A9590] text-sm font-normal leading-6 font-sans">
                      {item.answer}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
