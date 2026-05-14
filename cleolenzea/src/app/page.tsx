import { ParallaxBackground } from "@/components/landing/ParallaxBackground";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { AboutTherapist } from "@/components/landing/AboutTherapist";
import { WhatIsSomatic } from "@/components/landing/WhatIsSomatic";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { WhySomatic } from "@/components/landing/WhySomatic";
import { StatsCounter } from "@/components/landing/StatsCounter";
import { GreenCTA } from "@/components/landing/GreenCTA";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
import { Blog } from "@/components/landing/Blog";
import { CrisisBanner } from "@/components/landing/CrisisBanner";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <ParallaxBackground />
      <Header />
      <main style={{ position: "relative", zIndex: 1 }}>
        <Hero />
        <WhatIsSomatic />
        <AboutTherapist />
        <HowItWorks />
        <WhySomatic />
        <StatsCounter />
        <GreenCTA />
        <Testimonials />
        <Pricing />
        <Blog />
        <CrisisBanner />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
