import cron from "node-cron";
import type { NewsMonitorService } from "../news/services/news-monitor.service.js";
import type { Logger } from "pino";
export function scheduleNewsMonitoring(expression: string, monitor: NewsMonitorService, log: Logger) {
  return cron.schedule(expression, () => void monitor.pollAll().catch((err) => log.error({ err }, "Scheduled news poll failed")));
}
