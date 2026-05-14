"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Benefits", href: "#benefits" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Blog", href: "#blog" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-background/90 backdrop-blur-md shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="container-wide flex items-center justify-between h-16 sm:h-20 px-5 sm:px-6 lg:px-8">
          <a href="#home" className="flex items-center gap-2">
            <span className="font-heading text-xl sm:text-2xl font-normal text-warm-charcoal">
              Cleolenzea
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-warm-gray hover:text-warm-charcoal transition-colors duration-200 font-body text-sm"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="secondary" size="sm" href="#pricing">
              Appointment
            </Button>
          </div>

          <button
            className="md:hidden p-3 -mr-3 text-warm-charcoal min-w-[48px] min-h-[48px] flex items-center justify-center"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] bg-background flex flex-col">
          <div className="flex items-center justify-between h-16 px-5">
            <span className="font-heading text-2xl font-normal text-warm-charcoal">Cleolenzea</span>
            <button
              className="p-3 -mr-3 text-warm-charcoal min-w-[48px] min-h-[48px] flex items-center justify-center"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 flex flex-col justify-center px-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="py-4 text-warm-charcoal font-heading text-2xl font-normal border-b border-primary/10 hover:text-primary transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="px-8 pb-10">
            <Button variant="secondary" size="lg" href="#pricing" className="w-full" onClick={() => setMobileOpen(false)}>
              Book a Session
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
