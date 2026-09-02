import { describe, expect, it } from "vitest";
import { articleHash } from "../src/modules/news/services/rss.service.js";
describe("articleHash", () => {
  it("is stable for the same article identity", () => {
    const article = { url: "https://example.com/story", headline: "Football update", publishedAt: new Date("2026-09-02T12:00:00Z") };
    expect(articleHash(article)).toBe(articleHash(article));
  });
  it("changes when article identity changes", () => {
    expect(articleHash({ url: "https://example.com/a", headline: "A" })).not.toBe(articleHash({ url: "https://example.com/b", headline: "A" }));
  });
});
