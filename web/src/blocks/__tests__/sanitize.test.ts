import { describe, it, expect } from "vitest";
import { sanitizeBlockContent } from "@/blocks/sanitize";
import type { Block } from "@/blocks/types";

describe("sanitizeBlockContent", () => {
  it("strips a <script> tag from a richText block's html", () => {
    const blocks: Block[] = [
      { id: "b1", type: "richText", data: { html: "<p>Hello</p><script>alert(1)</script>" } },
    ];
    const [sanitized] = sanitizeBlockContent(blocks);
    expect(sanitized.data.html).not.toContain("<script>");
    expect(sanitized.data.html).toContain("<p>Hello</p>");
  });

  it("strips a <script> tag from a faq block's items[].answerHtml, leaving other items untouched", () => {
    const blocks: Block[] = [
      {
        id: "b1",
        type: "faq",
        data: {
          title: "FAQ",
          items: [
            { question: "Q1", answerHtml: "<p>safe <strong>bold</strong></p><script>alert(1)</script>" },
            { question: "Q2", answerHtml: "<p>already safe</p>" },
          ],
        },
      },
    ];
    const [sanitized] = sanitizeBlockContent(blocks);
    const items = sanitized.data.items as { question: string; answerHtml: string }[];
    expect(items[0].answerHtml).not.toContain("<script>");
    expect(items[0].answerHtml).toContain("<strong>bold</strong>");
    expect(items[1].answerHtml).toBe("<p>already safe</p>");
  });

  it("leaves safe tags (<p>, <strong>) intact", () => {
    const blocks: Block[] = [{ id: "b1", type: "richText", data: { html: "<p>Hi <strong>there</strong></p>" } }];
    const [sanitized] = sanitizeBlockContent(blocks);
    expect(sanitized.data.html).toBe("<p>Hi <strong>there</strong></p>");
  });

  it("leaves non-richtext fields untouched", () => {
    const blocks: Block[] = [{ id: "b1", type: "hero", data: { title: "<b>Hi</b>", overlay: true } }];
    const [sanitized] = sanitizeBlockContent(blocks);
    expect(sanitized.data.title).toBe("<b>Hi</b>");
  });

  it("is defensive against a block missing an expected field", () => {
    const blocks: Block[] = [{ id: "b1", type: "richText", data: {} }];
    expect(() => sanitizeBlockContent(blocks)).not.toThrow();
  });

  it("passes through unknown block types unchanged", () => {
    const blocks: Block[] = [{ id: "b1", type: "mystery", data: { foo: "<script>bar</script>" } }];
    const [sanitized] = sanitizeBlockContent(blocks);
    expect(sanitized.data.foo).toBe("<script>bar</script>");
  });
});
