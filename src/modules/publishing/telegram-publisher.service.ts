import type { PrismaClient } from "@prisma/client";
import type { Telegraf } from "telegraf";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}

export class TelegramPublisher {
  constructor(private readonly bot: Telegraf, private readonly db: PrismaClient, private readonly channelId: string) {}

  async publishProcessedNews(processedNewsId: string): Promise<boolean> {
    const alreadyPosted = await this.db.telegramPost.findUnique({
      where: { processedNewsId_channelId: { processedNewsId, channelId: this.channelId } }
    });
    if (alreadyPosted) return false;

    const news = await this.db.processedNews.findUnique({
      where: { id: processedNewsId },
      include: { article: { include: { source: true } } }
    });
    if (!news || news.status !== "APPROVED" || !news.burmeseHeadline || !news.burmeseContent) return false;

    const caption = `<b>${escapeHtml(news.burmeseHeadline)}</b>\n\n${escapeHtml(news.burmeseContent)}\n\n📌 Source: ${escapeHtml(news.sourceAttribution ?? news.article.source.name)}\n🔗 ${news.article.url}`;
    const message = news.article.featuredImage
      ? await this.bot.telegram.sendPhoto(this.channelId, news.article.featuredImage, { caption, parse_mode: "HTML" })
      : await this.bot.telegram.sendMessage(this.channelId, caption, { parse_mode: "HTML", link_preview_options: { is_disabled: false } });

    await this.db.$transaction([
      this.db.telegramPost.create({ data: { processedNewsId, telegramMessageId: String(message.message_id), channelId: this.channelId, postType: "NEWS" } }),
      this.db.processedNews.update({ where: { id: processedNewsId }, data: { status: "PUBLISHED" } })
    ]);
    return true;
  }
}
