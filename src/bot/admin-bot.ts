import { Markup, Telegraf } from "telegraf";
import type { Env } from "../config/env.js";
import type { PrismaClient } from "@prisma/client";

const menu = Markup.keyboard([["📰 Latest News", "✍️ Manual Post"], ["📅 Schedule Post", "🔴 Live Matches"], ["🔥 Big Matches", "⚙️ Settings"]]).resize();
export function createAdminBot(env: Env, db: PrismaClient): Telegraf | undefined {
  if (!env.TELEGRAM_BOT_TOKEN) return undefined;
  const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);
  bot.use(async (ctx, next) => {
    if (!ctx.from || !env.adminIds.has(String(ctx.from.id))) return ctx.reply("ဒီ bot ကို အသုံးပြုခွင့်မရှိပါ။");
    await db.adminUser.upsert({ where: { telegramId: String(ctx.from.id) }, update: { username: ctx.from.username, isActive: true }, create: { telegramId: String(ctx.from.id), username: ctx.from.username } });
    return next();
  });
  bot.start((ctx) => ctx.reply("365 Football Bot Admin မှ ကြိုဆိုပါတယ်။", menu));
  bot.hears("📰 Latest News", async (ctx) => {
    const articles = await db.scrapedArticle.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { source: true } });
    const text = articles.length ? articles.map((a, i) => `${i + 1}. ${a.headline}\n${a.source.name}`).join("\n\n") : "သတင်းအသစ် မရှိသေးပါ။";
    await ctx.reply(text, menu);
  });
  bot.hears(["✍️ Manual Post", "📅 Schedule Post"], (ctx) => ctx.reply("Phase 2: စာသား/ဓာတ်ပုံရေးပြီး preview နှင့် publish/schedule လုပ်နိုင်မည့် flow ကို ဆက်လက်ဖွင့်ပေးပါမည်။", menu));
  bot.hears(["🔴 Live Matches", "🔥 Big Matches", "⚙️ Settings"], (ctx) => ctx.reply("Phase 2 live-score and settings modules are scaffolded and awaiting provider configuration.", menu));
  return bot;
}
