import { describe, it, expect } from "vitest";
import { escapeHtml, urlSafe } from "@/lib/html-escape";

describe("escapeHtml", () => {
  it("escapes angle brackets", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;"
    );
  });

  it("escapes quotes and ampersands", () => {
    expect(escapeHtml('"a" & \'b\'')).toBe("&quot;a&quot; &amp; &#39;b&#39;");
  });

  it("passes through safe text", () => {
    expect(escapeHtml("Hello World")).toBe("Hello World");
  });
});

describe("urlSafe", () => {
  it("passes through https URLs", () => {
    expect(urlSafe("https://example.com/path")).toBe("https://example.com/path");
  });

  it("passes through mailto links", () => {
    expect(urlSafe("mailto:test@example.com")).toBe("mailto:test@example.com");
  });

  it("blocks javascript: URLs", () => {
    expect(urlSafe("javascript:alert(1)")).toBe("#");
  });

  it("handles invalid URLs", () => {
    expect(urlSafe("not a url")).toBe("#");
  });
});