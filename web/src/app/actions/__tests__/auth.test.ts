/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/ratelimit", () => ({
  limiters: { magicLink: null, magicLinkIp: null },
  getClientIp: vi.fn().mockResolvedValue("127.0.0.1"),
  checkLimit: vi.fn().mockResolvedValue({ ok: true, remaining: 10 }),
}));

vi.mock("@/lib/terms", () => ({
  recordTermsAcceptance: vi.fn().mockResolvedValue(undefined),
}));

import { signInWithMagicLink, updateUserName } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";

function mockSupabase(overrides: Record<string, unknown> = {}) {
  const chain: any = {
    from: vi.fn(() => chain),
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(() => chain),
    single: vi.fn(() => chain),
    update: vi.fn(() => chain),
    auth: {
      getUser: vi.fn(),
      signInWithOtp: vi.fn(),
    },
    ...overrides,
  };
  return chain;
}

describe("signInWithMagicLink", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends magic link for existing user regardless of registration flag", async () => {
    const supabase = mockSupabase();
    supabase.maybeSingle.mockResolvedValue({ data: { id: "user-1" } });
    supabase.auth.signInWithOtp.mockResolvedValue({});
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const result = await signInWithMagicLink("user@example.com");

    expect(result).toEqual({ success: true });
    expect(supabase.auth.signInWithOtp).toHaveBeenCalled();
  });

  it("blocks new user when registration is closed (no enumeration leak)", async () => {
    const supabase = mockSupabase();
    supabase.maybeSingle.mockResolvedValue({ data: null });
    supabase.single.mockResolvedValue({
      data: { open_registration: false },
    });
    supabase.auth.signInWithOtp.mockResolvedValue({});
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const result = await signInWithMagicLink("newuser@example.com");

    expect(result).toEqual({
      error:
        "Registration is currently closed. Please contact the platform administrator for an invitation.",
    });
    expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it("allows new user when registration is open", async () => {
    const supabase = mockSupabase();
    supabase.maybeSingle.mockResolvedValue({ data: null });
    supabase.single.mockResolvedValue({
      data: { open_registration: true },
    });
    supabase.auth.signInWithOtp.mockResolvedValue({});
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const result = await signInWithMagicLink("newuser@example.com");

    expect(result).toEqual({ success: true });
    expect(supabase.auth.signInWithOtp).toHaveBeenCalled();
  });

  it("returns error when OTP send fails", async () => {
    const supabase = mockSupabase();
    supabase.maybeSingle.mockResolvedValue({ data: { id: "user-1" } });
    supabase.auth.signInWithOtp.mockResolvedValue({ error: { message: "Rate limited" } });
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const result = await signInWithMagicLink("user@example.com");

    expect(result).toEqual({ error: "Rate limited" });
  });
});

describe("updateUserName", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects without ToS acceptance", async () => {
    const supabase = mockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
    });
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const result = await updateUserName("Alice", false);

    expect(result).toEqual({
      error: "You must accept the Terms of Service and Privacy Policy to continue.",
    });
  });

  it("rejects when not authenticated", async () => {
    const supabase = mockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authed" },
    });
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const result = await updateUserName("Alice", true);

    expect(result).toEqual({ error: "Not authenticated. Please sign in again." });
  });
});