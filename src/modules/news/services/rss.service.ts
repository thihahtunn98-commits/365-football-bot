import { createHash } from "node:crypto";
import Parser from "rss-parser";

export type RssArticle = {
  externalId?: string;
  url: string;
  headline: string;
  summary?: string;
  featuredImage?: string;
  publishedAt?: Date;
  rawPayload: Record<string, unknown>;
};

type RssItemExtras = { mediaContent?: { $?: { url?: string } }; enclosure?: { url?: string } };

export function articleHash(article: Pick<RssArticle, "url" | "headline" | "publishedAt">): string {
  return createHash("sha256")
    .update(`${article.url}|${article.headline}|${article.publishedAt?.toISOString() ?? ""}`)
    .digest("hex");
}

function validateFeedUrl(feedUrl: string): void {
  const url = new URL(feedUrl);
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) {
    throw new Error("RSS feed URL must use HTTP(S) and must not contain credentials");
  }
}

function isHttpUrl(value: string): boolean {
  try {
    validateFeedUrl(value);
    return true;
  } catch {
    return false;
  }
}

function parsePublishedAt(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function fetchRssArticles(feedUrl: string, limit: number, timeoutMs: number): Promise<RssArticle[]> {
  validateFeedUrl(feedUrl);
  const parser = new Parser({
    timeout: timeoutMs,
    customFields: { item: [["media:content", "mediaContent", { keepArray: false }], ["content:encoded", "contentEncoded"]] }
  });
  const feed = await parser.parseURL(feedUrl);

  return feed.items.slice(0, limit).flatMap((item) => {
    const url = item.link?.trim();
    const headline = item.title?.trim();
    if (!url || !headline || !isHttpUrl(url)) return [];

    const rawItem = item as unknown as RssItemExtras;
    return [{
      externalId: item.guid,
      url,
      headline,
      summary: item.contentSnippet?.trim() || item.content?.trim(),
      featuredImage: rawItem.enclosure?.url || rawItem.mediaContent?.$?.url,
      publishedAt: parsePublishedAt(item.isoDate ?? item.pubDate),
      rawPayload: item as unknown as Record<string, unknown>
    }];
  });
}
