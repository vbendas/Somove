import type { Metadata } from "next";
import { Lora, DM_Sans } from "next/font/google";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cleolenzea — Somatic Therapy for Embodied Healing",
  description:
    "Somatic therapy for anxiety, trauma, and emotional resilience. Discover the wisdom your body holds. Online sessions from wherever you feel safe.",
  keywords: [
    "somatic therapy",
    "somatic experiencing",
    "dance movement therapy",
    "trauma therapy",
    "nervous system regulation",
    "online therapy",
    "body-based healing",
  ],
  openGraph: {
    title: "Cleolenzea — Somatic Therapy for Embodied Healing",
    description:
      "Somatic therapy for anxiety, trauma, and emotional resilience. Discover the wisdom your body holds.",
    type: "website",
    url: "https://somove.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${lora.variable} ${dmSans.variable} font-body antialiased bg-background text-warm-charcoal`}
      >
        {children}
      </body>
    </html>
  );
}
