import type { Metadata, Viewport } from "next";
import { Lora, DM_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
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
  title: "Somove — Somatic Therapy Platform",
  description:
    "Book somatic therapy sessions with certified practitioners. Full-body video calls with contactless gesture controls, secure messaging, and practice management.",
  keywords: [
    "somatic therapy",
    "somatic experiencing",
    "dance movement therapy",
    "trauma therapy",
    "nervous system regulation",
    "online therapy",
    "body-based healing",
    "telehealth",
    "therapy platform",
  ],
  openGraph: {
    title: "Somove — Somatic Therapy Platform",
    description:
      "Book somatic therapy sessions with certified practitioners. Full-body video calls with contactless gesture controls.",
    type: "website",
    url: "https://somove.app",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#D4A574",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${lora.variable} ${dmSans.variable} font-body antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
