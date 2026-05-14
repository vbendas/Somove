"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import SmartSimpleBrilliant from "../components/smart-simple-brilliant"
import YourWorkInSync from "../components/your-work-in-sync"
import EffortlessIntegration from "../components/effortless-integration-updated"
import NumbersThatSpeak from "../components/numbers-that-speak"
import DocumentationSection from "../components/documentation-section"
import TestimonialsSection from "../components/testimonials-section"
import FAQSection from "../components/faq-section"

import CTASection from "../components/cta-section"
import FooterSection from "../components/footer-section"

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="px-[14px] py-[6px] bg-white shadow-[0px_0px_0px_4px_rgba(55,50,47,0.05)] overflow-hidden rounded-[90px] flex justify-start items-center gap-[8px] border border-[rgba(2,6,23,0.08)] shadow-xs">
      <div className="w-[14px] h-[14px] relative overflow-hidden flex items-center justify-center">{icon}</div>
      <div className="text-center flex justify-center flex-col text-[#2D2A26] text-xs font-medium leading-3 font-sans">
        {text}
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [activeCard, setActiveCard] = useState(0)
  const [progress, setProgress] = useState(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    const progressInterval = setInterval(() => {
      if (!mountedRef.current) return

      setProgress((prev) => {
        if (prev >= 100) {
          if (mountedRef.current) {
            setActiveCard((current) => (current + 1) % 3)
          }
          return 0
        }
        return prev + 2
      })
    }, 100)

    return () => {
      clearInterval(progressInterval)
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleCardClick = (index: number) => {
    if (!mountedRef.current) return
    setActiveCard(index)
    setProgress(0)
  }

  return (
    <div className="w-full min-h-screen bg-[#FFFDF5] overflow-x-hidden">
      <div className="w-full flex flex-col">
        {/* Navigation */}
        <div className="w-full bg-[#FFFDF5] border-b border-[rgba(55,50,47,0.06)] px-4 sm:px-6 md:px-8 lg:px-12" style={{ colorScheme: 'light' }}>
          <div className="w-full h-12 sm:h-14 md:h-16 lg:h-[84px] flex justify-between items-center relative">
            <div className="flex-1 flex justify-start items-center gap-4 sm:gap-6">
              <div className="text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans cursor-pointer hover:text-[#2D2A26]">
                Features
              </div>
              <div className="text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans cursor-pointer hover:text-[#2D2A26]">
                For Therapists
              </div>
            </div>

            <div className="absolute left-1/2 transform -translate-x-1/2 flex-shrink-0 pointer-events-none">
              <img src="/logo.png" alt="Somove" className="h-16 sm:h-20 md:h-24 lg:h-[150px] w-auto" />
            </div>

            <div className="flex-1 flex justify-end items-center">
              <div className="px-3 sm:px-4 md:px-[14px] py-1.5 sm:py-[6px] bg-[#2D2A26] rounded-full flex justify-center items-center cursor-pointer hover:bg-[#1a1816] transition-colors">
                <span className="text-white text-xs md:text-[13px] font-medium leading-5 font-sans">
                  Get Started
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="w-full pt-8 sm:pt-12 md:pt-16 lg:pt-20 pb-8 sm:pb-12 md:pb-16 flex flex-col items-center px-4 sm:px-6 md:px-8 lg:px-12 relative">
          <div className="w-full max-w-[1100px] mx-auto flex flex-col items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            <div className="w-full max-w-[900px] text-center text-[#2D2A26] text-[24px] xs:text-[28px] sm:text-[36px] md:text-[52px] lg:text-[80px] font-normal leading-[1.1] sm:leading-[1.15] md:leading-[1.2] lg:leading-24 font-serif">
              Your practice,
              <br />
              powered by Somove
            </div>
            <div className="w-full max-w-[620px] text-center text-[rgba(55,50,47,0.80)] sm:text-lg md:text-xl lg:text-lg leading-[1.4] sm:leading-[1.45] md:leading-[1.5] lg:leading-7 font-sans font-medium text-sm">
              The open-source practice management platform for therapists, yoga teachers, dance therapists, psychologists, and movement professionals. Scheduling, video calls with gesture controls, payments, messaging, and client management — completely free.
            </div>
          </div>

          <div className="w-full max-w-[497px] flex flex-col items-center gap-6 sm:gap-8 md:gap-10 lg:gap-12 relative z-10 mt-6 sm:mt-8 md:mt-10 lg:mt-12">
            <div className="h-10 sm:h-11 md:h-12 px-6 sm:px-8 md:px-10 lg:px-12 py-2 sm:py-[6px] relative bg-[#2D2A26] shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] overflow-hidden rounded-full flex justify-center items-center cursor-pointer hover:bg-[#1a1816] transition-colors">
              <div className="w-20 sm:w-24 md:w-28 lg:w-44 h-[41px] absolute left-0 top-[-0.5px] bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(0,0,0,0.10)] mix-blend-multiply"></div>
              <span className="text-white text-sm sm:text-base md:text-[15px] font-medium leading-5 font-sans">
                Get Started
              </span>
            </div>
          </div>

          <div className="absolute top-[232px] sm:top-[248px] md:top-[264px] lg:top-[320px] left-1/2 transform -translate-x-1/2 z-0 pointer-events-none">
            <img
              src="/mask-group-pattern.svg"
              alt=""
              className="w-[936px] sm:w-[1404px] md:w-[2106px] lg:w-[2808px] h-auto opacity-30 sm:opacity-40 md:opacity-50 mix-blend-multiply"
              style={{
                filter: "hue-rotate(15deg) saturate(0.7) brightness(1.2)",
              }}
            />
          </div>

          {/* Feature Preview */}
          <div className="w-full max-w-[1200px] mx-auto pt-2 sm:pt-4 pb-6 sm:pb-8 md:pb-10 flex flex-col items-center gap-2 relative z-5 my-8 sm:my-12 md:my-16 lg:my-16 mb-0 lg:pb-0">
            <div className="w-full h-[200px] sm:h-[280px] md:h-[450px] lg:h-[695.55px] bg-white shadow-[0px_0px_0px_0.9056603908538818px_rgba(0,0,0,0.08)] overflow-hidden rounded-[6px] sm:rounded-[8px] lg:rounded-[9.06px]">
              <div className="w-full h-full relative overflow-hidden">
                <div
                  className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                    activeCard === 0 ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-sm"
                  }`}
                >
                  <div className="w-full h-full bg-gradient-to-br from-[#FFF5E1] to-[#F0E8D8] flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="text-[#D4A574] text-6xl mb-4">&#x1F4C5;</div>
                      <div className="text-[#2D2A26] text-xl font-semibold font-sans">Scheduling Dashboard</div>
                      <div className="text-[#9A9590] text-sm mt-2 font-sans">Manage your availability and bookings</div>
                    </div>
                  </div>
                </div>

                <div
                  className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                    activeCard === 1 ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-sm"
                  }`}
                >
                  <div className="w-full h-full bg-gradient-to-br from-[#C5D5C5] to-[#E8F0E8] flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="text-[#8BA888] text-6xl mb-4">&#x1F3AC;</div>
                      <div className="text-[#2D2A26] text-xl font-semibold font-sans">Full-Body Video Session</div>
                      <div className="text-[#9A9590] text-sm mt-2 font-sans">Contactless gesture controls for hands-free therapy</div>
                    </div>
                  </div>
                </div>

                <div
                  className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                    activeCard === 2 ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-sm"
                  }`}
                >
                  <div className="w-full h-full bg-gradient-to-br from-[#E8C4B8] to-[#F5E4DC] flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="text-[#E8C4B8] text-6xl mb-4">&#x1F4AC;</div>
                      <div className="text-[#2D2A26] text-xl font-semibold font-sans">Client Messaging</div>
                      <div className="text-[#9A9590] text-sm mt-2 font-sans">Real-time chat with encrypted, secure messaging</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="w-full border-t border-[#E0DEDB] border-b border-[#E0DEDB]">
            <div className="w-full max-w-[1200px] mx-auto flex flex-col md:flex-row">
              <FeatureCard
                title="Scheduling & Booking"
                description="Let clients self-book with embedded scheduling. Automatic confirmations and reminders."
                isActive={activeCard === 0}
                progress={activeCard === 0 ? progress : 0}
                onClick={() => handleCardClick(0)}
              />
              <FeatureCard
                title="Full-Body Video Sessions"
                description="Purpose-built for movement therapy. Contactless gesture controls keep sessions hands-free."
                isActive={activeCard === 1}
                progress={activeCard === 1 ? progress : 0}
                onClick={() => handleCardClick(1)}
              />
              <FeatureCard
                title="Client Management"
                description="Secure messaging, session notes, payment tracking — everything in one place."
                isActive={activeCard === 2}
                progress={activeCard === 2 ? progress : 0}
                onClick={() => handleCardClick(2)}
              />
            </div>
          </div>

          {/* Social Proof Section */}
          <div className="w-full border-b border-[rgba(55,50,47,0.12)]">
            <div className="w-full border-b border-[rgba(55,50,47,0.12)] px-4 sm:px-6 md:px-24 py-8 sm:py-12 md:py-16 flex justify-center">
              <div className="w-full max-w-[586px] flex flex-col items-center gap-3 sm:gap-4">
                <Badge
                  icon={
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="1" y="3" width="4" height="6" stroke="#2D2A26" strokeWidth="1" fill="none" />
                      <rect x="7" y="1" width="4" height="8" stroke="#2D2A26" strokeWidth="1" fill="none" />
                      <rect x="2" y="4" width="1" height="1" fill="#2D2A26" />
                      <rect x="3.5" y="4" width="1" height="1" fill="#2D2A26" />
                      <rect x="2" y="5.5" width="1" height="1" fill="#2D2A26" />
                      <rect x="3.5" y="5.5" width="1" height="1" fill="#2D2A26" />
                      <rect x="8" y="2" width="1" height="1" fill="#2D2A26" />
                      <rect x="9.5" y="2" width="1" height="1" fill="#2D2A26" />
                      <rect x="8" y="3.5" width="1" height="1" fill="#2D2A26" />
                      <rect x="9.5" y="3.5" width="1" height="1" fill="#2D2A26" />
                      <rect x="8" y="5" width="1" height="1" fill="#2D2A26" />
                      <rect x="9.5" y="5" width="1" height="1" fill="#2D2A26" />
                    </svg>
                  }
                  text="Trusted"
                />
                <div className="w-full max-w-[472.55px] text-center text-[#2D2A26] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
                  Built for practitioners across Europe
                </div>
                <div className="text-center text-[#9A9590] text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans">
                  Therapists, yoga teachers, and movement professionals
                  <br className="hidden sm:block" />
                  trust Somove to run their practice.
                </div>
              </div>
            </div>

            {/* Logo Grid */}
            <div className="w-full border-t border-[rgba(55,50,47,0.12)]">
              <div className="w-full max-w-[1200px] mx-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-0 border-l border-r border-[rgba(55,50,47,0.12)]">
                {["Somatic Therapy", "Yoga Therapy", "Dance Therapy", "Bodywork", "Psychology", "Breathwork", "Movement Coaching", "Trauma Therapy"].map((name, index) => {
                  const isDesktopFirstColumn = index % 4 === 0
                  const isDesktopLastColumn = index % 4 === 3
                  const isDesktopTopRow = index < 4
                  const isDesktopBottomRow = index >= 4

                  return (
                    <div
                      key={index}
                      className={`
                        h-24 xs:h-28 sm:h-32 md:h-36 lg:h-40 flex justify-center items-center gap-1 xs:gap-2 sm:gap-3
                        border-b border-[rgba(227,226,225,0.5)]
                        ${index < 6 ? "sm:border-b-[0.5px]" : "sm:border-b"}
                        ${index >= 6 ? "border-b" : ""}
                        ${index % 2 === 0 ? "border-r-[0.5px]" : ""}
                        sm:border-r-[0.5px] sm:border-l-0
                        ${isDesktopFirstColumn ? "md:border-l" : "md:border-l-[0.5px]"}
                        ${isDesktopLastColumn ? "md:border-r" : "md:border-r-[0.5px]"}
                        ${isDesktopTopRow ? "md:border-b-[0.5px]" : ""}
                        ${isDesktopBottomRow ? "md:border-t-[0.5px] md:border-b" : ""}
                        border-[#E3E2E1]
                      `}
                    >
                      <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 relative shadow-[0px_-4px_8px_rgba(255,255,255,0.64)_inset] overflow-hidden rounded-full bg-[#FFF5E1] flex items-center justify-center">
                        <div className="text-[#D4A574] text-xs sm:text-sm font-bold">{name.charAt(0)}</div>
                      </div>
                      <div className="text-center text-[#2D2A26] text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-medium leading-tight md:leading-9 font-sans">
                        {name}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Bento Grid Section */}
          <div className="w-full border-b border-[rgba(55,50,47,0.12)]">
            <div className="w-full border-b border-[rgba(55,50,47,0.12)] px-4 sm:px-6 md:px-8 lg:px-0 py-8 sm:py-12 md:py-16 flex justify-center">
              <div className="w-full max-w-[750px] flex flex-col items-center gap-3 sm:gap-4">
                <Badge
                  icon={
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="1" y="1" width="4" height="4" stroke="#2D2A26" strokeWidth="1" fill="none" />
                      <rect x="7" y="1" width="4" height="4" stroke="#2D2A26" strokeWidth="1" fill="none" />
                      <rect x="1" y="7" width="4" height="4" stroke="#2D2A26" strokeWidth="1" fill="none" />
                      <rect x="7" y="7" width="4" height="4" stroke="#2D2A26" strokeWidth="1" fill="none" />
                    </svg>
                  }
                  text="Platform Features"
                />
                <div className="w-full max-w-[700px] text-center text-[#2D2A26] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
                  Everything your practice needs
                </div>
                <div className="text-center text-[#9A9590] text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans">
                  From booking to session to follow-up,
                  <br />
                  Somove handles your entire workflow.
                </div>
              </div>
            </div>

            <div className="w-full max-w-[1200px] mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-l border-r border-[rgba(55,50,47,0.12)]">
                {/* Top Left */}
                <div className="border-b border-r-0 md:border-r border-[rgba(55,50,47,0.12)] p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-start items-start gap-4 sm:gap-6">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-[#2D2A26] text-lg sm:text-xl font-semibold leading-tight font-sans">
                      Scheduling, simplified
                    </h3>
                    <p className="text-[#9A9590] text-sm md:text-base font-normal leading-relaxed font-sans">
                      Clients self-book based on your real availability. Automatic confirmations, reminders, and calendar sync.
                    </p>
                  </div>
                  <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] rounded-lg flex items-center justify-center overflow-hidden">
                    <SmartSimpleBrilliant
                      width="100%"
                      height="100%"
                      theme="light"
                      className="scale-50 sm:scale-65 md:scale-75 lg:scale-90"
                    />
                  </div>
                </div>

                {/* Top Right */}
                <div className="border-b border-[rgba(55,50,47,0.12)] p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-start items-start gap-4 sm:gap-6">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-[#2D2A26] font-semibold leading-tight font-sans text-lg sm:text-xl">
                      Real-time messaging
                    </h3>
                    <p className="text-[#9A9590] text-sm md:text-base font-normal leading-relaxed font-sans">
                      Encrypted 1:1 chat with every client. Quick check-ins, session follow-ups, and emergency support.
                    </p>
                  </div>
                  <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] rounded-lg flex overflow-hidden text-right items-center justify-center">
                    <YourWorkInSync
                      width="400"
                      height="250"
                      theme="light"
                      className="scale-60 sm:scale-75 md:scale-90"
                    />
                  </div>
                </div>

                {/* Bottom Left */}
                <div className="border-r-0 md:border-r border-[rgba(55,50,47,0.12)] p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-start items-start gap-4 sm:gap-6">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-[#2D2A26] text-lg sm:text-xl font-semibold leading-tight font-sans">
                      Your integrations, connected
                    </h3>
                    <p className="text-[#9A9590] text-sm md:text-base font-normal leading-relaxed font-sans">
                      Supabase, Daily.co, Cal.com, Stripe — enterprise-grade tools, free-tier friendly, wired together.
                    </p>
                  </div>
                  <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] rounded-lg flex overflow-hidden justify-center items-center relative">
                    <div className="w-full h-full flex items-center justify-center">
                      <EffortlessIntegration width={400} height={250} className="max-w-full max-h-full" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#FFFDF5] to-transparent pointer-events-none"></div>
                  </div>
                </div>

                {/* Bottom Right */}
                <div className="p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-start items-start gap-4 sm:gap-6">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-[#2D2A26] text-lg sm:text-xl font-semibold leading-tight font-sans">
                      Track your practice growth
                    </h3>
                    <p className="text-[#9A9590] text-sm md:text-base font-normal leading-relaxed font-sans">
                      Revenue overview, session history, client retention — clear numbers that help you grow with confidence.
                    </p>
                  </div>
                  <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] rounded-lg flex overflow-hidden items-center justify-center relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <NumbersThatSpeak
                        width="100%"
                        height="100%"
                        theme="light"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#FFFDF5] to-transparent pointer-events-none"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DocumentationSection />
          <TestimonialsSection />
          <FAQSection />
          <CTASection />
          <FooterSection />
        </div>
      </div>
    </div>
  )
}

function FeatureCard({
  title,
  description,
  isActive,
  progress,
  onClick,
}: {
  title: string
  description: string
  isActive: boolean
  progress: number
  onClick: () => void
}) {
  return (
    <div
      className={`w-full md:flex-1 self-stretch px-6 py-5 overflow-hidden flex flex-col justify-start items-start gap-2 cursor-pointer relative border-b md:border-b-0 last:border-b-0 bg-[#FFFDF5] ${
        isActive
          ? "shadow-[0px_0px_0px_0.75px_#E0DEDB_inset]"
          : "border-l-0 border-r-0 md:border border-[#E0DEDB]/80"
      }`}
      onClick={onClick}
    >
      {isActive && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-[rgba(50,45,43,0.08)]">
          <div
            className="h-full bg-[#D4A574] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="self-stretch flex justify-center flex-col text-[#2D2A26] text-sm md:text-sm font-semibold leading-6 md:leading-6 font-sans">
        {title}
      </div>
      <div className="self-stretch text-[#9A9590] text-[13px] md:text-[13px] font-normal leading-[22px] md:leading-[22px] font-sans">
        {description}
      </div>
    </div>
  )
}
