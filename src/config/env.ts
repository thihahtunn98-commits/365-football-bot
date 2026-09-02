import "dotenv/config";
import { z } from "zod";

const optionalSecret = z.preprocess((value) => value === "" ? undefined : value, z.string().min(1).optional());

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  DATABASE_URL: z.string().url(),
  TELEGRAM_BOT_TOKEN: optionalSecret,
  TELEGRAM_CHANNEL_ID: optionalSecret,
  TELEGRAM_ADMIN_IDS: z.string().default(""),
  NEWS_POLL_CRON: z.string().default("*/10 * * * *"),
  NEWS_MAX_ARTICLES_PER_SOURCE: z.coerce.number().int().min(1).max(50).default(10),
  RSS_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).default(15000),
  FOOTBALL_PROVIDER: z.enum(["api-football"]).default("api-football"),
  API_FOOTBALL_KEY: optionalSecret
});
export type Env = z.infer<typeof schema> & { adminIds: Set<string> };
export const env: Env = (() => {
  const parsed = schema.parse(process.env);
  return { ...parsed, adminIds: new Set(parsed.TELEGRAM_ADMIN_IDS.split(",").map((id) => id.trim()).filter(Boolean)) };
})();
