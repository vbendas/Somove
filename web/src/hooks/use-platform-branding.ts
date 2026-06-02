"use client";

import { useEffect, useState } from "react";
import { getPlatformSettings, type PlatformSettings } from "@/lib/platform";

export function usePlatformBranding() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const s = await getPlatformSettings();
        setSettings(s);
      } catch {
        // Use defaults
      }
    }
    load();
  }, []);

  return settings;
}

export function applyBranding(settings: PlatformSettings | null) {
  if (!settings) return;

  const root = document.documentElement;
  root.style.setProperty("--primary", settings.primary_color);
  root.style.setProperty("--ring", settings.primary_color);
  root.style.setProperty("--accent", settings.accent_color);
  root.style.setProperty("--background", settings.background_color);
}
