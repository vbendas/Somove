import type { Metadata, Viewport } from "next";
import { Lora, DM_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import ChatwootWidget from "@/components/support/chatwoot-widget";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { SWRegister, PushPermission } from "@/components/notifications/sw-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { getPlatformSettings } from "@/lib/platform";
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

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPlatformSettings();
  const name = settings.platform_name;
  const tagline = settings.platform_tagline || "Professional Session Platform";

  return {
    title: `${name} — ${tagline}`,
    description: `Book sessions with certified professionals on ${name}. Video calls, secure messaging, and practice management.`,
    keywords: [
      "online sessions",
      "video coaching",
      "professional services",
      "remote learning",
      "practice management",
      "session booking",
      "telehealth",
      "video calls",
      "online platform",
    ],
    openGraph: {
      title: `${name} — ${tagline}`,
      description: `Book sessions with certified professionals on ${name}.`,
      type: "website",
      url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    },
    manifest: "/manifest.json",
  };
}

export async function generateViewport(): Promise<Viewport> {
  const settings = await getPlatformSettings();
  return {
    themeColor: settings.primary_color,
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${lora.variable} ${dmSans.variable} font-body antialiased`}
      >
        <NotificationProvider>
          {children}
          <Toaster />
          <ChatwootWidget />
          <SWRegister />
          <PushPermission />
          <InstallPrompt />
        </NotificationProvider>
      </body>
    </html>
  );
}
