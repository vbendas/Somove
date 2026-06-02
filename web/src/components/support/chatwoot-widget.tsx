"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

declare global {
  interface Window {
    chatwootSettings?: {
      hideMessageBubble?: boolean;
      position?: "left" | "right";
      locale?: string;
      type?: "standard" | "expanded";
    };
    chatwootSDK?: {
      run: () => void;
      setUser: (identifier: string, user: Record<string, string>) => void;
      reset: () => void;
      toggle: () => void;
    };
    $chatwoot?: {
      setUser: (identifier: string, user: Record<string, string>) => void;
      reset: () => void;
      toggle: () => void;
    };
  }
}

const HIDDEN_ROUTES = ["/session/"];

export default function ChatwootWidget() {
  const pathname = usePathname();
  const websiteToken = process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN;
  const baseUrl = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL;
  const isHidden = HIDDEN_ROUTES.some((route) => pathname?.startsWith(route));

  useEffect(() => {
    if (!websiteToken || !baseUrl) return;

    window.chatwootSettings = {
      hideMessageBubble: false,
      position: "right",
      locale: "en",
      type: "standard",
    };

    const script = document.createElement("script");
    script.src = `${baseUrl}/packs/js/sdk.js`;
    script.async = true;
    script.dataset.websiteToken = websiteToken;
    document.body.appendChild(script);

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user && window.$chatwoot) {
        const { data: userProfile } = await supabase
          .from("users")
          .select("name, email, role")
          .eq("id", session.user.id)
          .single();

        window.$chatwoot.setUser(session.user.id, {
          name: userProfile?.name || session.user.email?.split("@")[0] || "User",
          email: session.user.email || "",
          role: userProfile?.role || "client",
        });
      } else if (!session && window.$chatwoot) {
        window.$chatwoot.reset();
      }
    });

    return () => {
      subscription.unsubscribe();
      const existingScript = document.querySelector(
        `script[src="${baseUrl}/packs/js/sdk.js"]`
      );
      if (existingScript) existingScript.remove();
    };
  }, [websiteToken, baseUrl]);

  if (isHidden) return null;

  return null;
}
