import { Prisma, type PrismaClient } from "@prisma/client";
import type { Logger } from "pino";
import { articleHash, fetchRssArticles } from "./rss.service.js";

export class NewsMonitorService {
  constructor(
    private readonly db: PrismaClient,
    private readonly log: Logger,
    private readonly maxArticles: number,
    private readonly requestTimeoutMs: number
  ) {}

  async pollAll(): Promise<{ sources: number; created: number }> {
    const sources = await this.db.newsSource.findMany({
      where: { isActive: true, rssUrl: { not: null } }
    });
    const now = Date.now();
    const dueSources = sources.filter((source) => {
      if (!source.lastPolledAt) return true;
      return now - source.lastPolledAt.getTime() >= source.pollIntervalMins * 60_000;
    });

    let created = 0;
    for (const source of dueSources) created += await this.pollSource(source);
    return { sources: dueSources.length, created };
  }

  async pollSource(source: { id: string; name: string; rssUrl: string | null }): Promise<number> {
    if (!source.rssUrl) return 0;

    try {
      const articles = await fetchRssArticles(source.rssUrl, this.maxArticles, this.requestTimeoutMs);
      let created = 0;

      for (const article of articles) {
        const contentHash = articleHash(article);
        const existing = await this.db.scrapedArticle.findFirst({
          where: { OR: [{ url: article.url }, { contentHash }] },
          select: { id: true }
        });
        if (existing) continue;

        try {
          await this.db.scrapedArticle.create({
            data: {
              sourceId: source.id,
              externalId: article.externalId,
              url: article.url,
              headline: article.headline,
              summary: article.summary,
              featuredImage: article.featuredImage,
              publishedAt: article.publishedAt,
              contentHash,
              rawPayload: JSON.parse(JSON.stringify(article.rawPayload)) as Prisma.InputJsonValue
            }
          });
          created++;
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
          throw error;
        }
      }

      await this.db.newsSource.update({ where: { id: source.id }, data: { lastPolledAt: new Date() } });
      this.log.info({ source: source.name, created }, "RSS source polled");
      return created;
    } catch (error) {
      this.log.error({ err: error, source: source.name }, "RSS polling failed");
      return 0;
    }
  }
}
