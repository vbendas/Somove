import { describe, it, expect } from "vitest";
import { createSessionSchema, sendMessageSchema, inviteSchema } from "@/lib/schemas";

describe("createSessionSchema", () => {
  it("accepts valid session input", () => {
    const result = createSessionSchema.safeParse({
      therapistId: "550e8400-e29b-41d4-a716-446655440000",
      scheduledAt: "2025-12-31T10:00:00Z",
      durationMin: 60,
      sessionType: "single",
      priceCents: 5000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid therapistId (non-UUID)", () => {
    const result = createSessionSchema.safeParse({
      therapistId: "not-a-uuid",
      scheduledAt: "2025-12-31T10:00:00Z",
      durationMin: 60,
      sessionType: "single",
      priceCents: 5000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects duration below 15 minutes", () => {
    const result = createSessionSchema.safeParse({
      therapistId: "550e8400-e29b-41d4-a716-446655440000",
      scheduledAt: "2025-12-31T10:00:00Z",
      durationMin: 5,
      sessionType: "single",
      priceCents: 5000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid sessionType", () => {
    const result = createSessionSchema.safeParse({
      therapistId: "550e8400-e29b-41d4-a716-446655440000",
      scheduledAt: "2025-12-31T10:00:00Z",
      durationMin: 60,
      sessionType: "group",
      priceCents: 5000,
    });
    expect(result.success).toBe(false);
  });
});

describe("sendMessageSchema", () => {
  it("accepts valid message", () => {
    const result = sendMessageSchema.safeParse({
      conversationId: "550e8400-e29b-41d4-a716-446655440000",
      body: "Hello there!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty body", () => {
    const result = sendMessageSchema.safeParse({
      conversationId: "550e8400-e29b-41d4-a716-446655440000",
      body: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects body over 10000 chars", () => {
    const result = sendMessageSchema.safeParse({
      conversationId: "550e8400-e29b-41d4-a716-446655440000",
      body: "x".repeat(10001),
    });
    expect(result.success).toBe(false);
  });
});

describe("inviteSchema", () => {
  it("accepts valid invite", () => {
    const result = inviteSchema.safeParse({
      email: "test@example.com",
      role: "therapist",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = inviteSchema.safeParse({
      email: "not-an-email",
      role: "therapist",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid role", () => {
    const result = inviteSchema.safeParse({
      email: "test@example.com",
      role: "superadmin",
    });
    expect(result.success).toBe(false);
  });
});