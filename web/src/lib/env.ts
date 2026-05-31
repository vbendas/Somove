import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, {
      message: "SUPABASE_SERVICE_ROLE_KEY is required. Get it from your Supabase project settings → API.",
    }),
    CAL_WEBHOOK_SECRET: z.string().optional(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url({
      message: "NEXT_PUBLIC_SUPABASE_URL must be a valid URL. Get it from your Supabase project settings → API.",
    }),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, {
      message: "NEXT_PUBLIC_SUPABASE_ANON_KEY is required. Get it from your Supabase project settings → API.",
    }),
    NEXT_PUBLIC_SITE_URL: z.string().url({
      message: "NEXT_PUBLIC_SITE_URL must be a valid URL (e.g., http://localhost:3000 or https://somove.app).",
    }),
  },
  runtimeEnv: {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    CAL_WEBHOOK_SECRET: process.env.CAL_WEBHOOK_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
