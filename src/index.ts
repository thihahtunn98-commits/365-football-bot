import { createServer } from "./api/server.js";
import { createAdminBot } from "./bot/admin-bot.js";
import { env } from "./config/env.js";
import { prisma } from "./db/client.js";
import { logger } from "./lib/logger.js";
import { NewsMonitorService } from "./modules/news/services/news-monitor.service.js";
import { scheduleNewsMonitoring } from "./modules/scheduling/news.scheduler.js";

const monitor = new NewsMonitorService(prisma, logger, env.NEWS_MAX_ARTICLES_PER_SOURCE, env.RSS_REQUEST_TIMEOUT_MS);
scheduleNewsMonitoring(env.NEWS_POLL_CRON, monitor, logger);
void monitor.pollAll().catch((error) => logger.error({ err: error }, "Initial news poll failed"));

const bot = createAdminBot(env, prisma);
if (bot) {
  bot.catch((error) => logger.error({ err: error }, "Telegram bot update failed"));
  void bot.launch().then(() => logger.info("Telegram admin bot started")).catch((error) => logger.error({ err: error }, "Telegram admin bot failed to start"));
} else {
  logger.warn("Telegram bot token absent; admin bot disabled");
}

const app = createServer(prisma, logger);
const shutdown = async () => {
  if (bot) bot.stop("shutdown");
  await app.close();
  await prisma.$disconnect();
};
process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
await app.listen({ port: env.PORT, host: "0.0.0.0" });
