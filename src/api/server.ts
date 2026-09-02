import Fastify from "fastify";
import type { PrismaClient } from "@prisma/client";
import type { Logger } from "pino";

const dashboard = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>365 Football Bot</title><style>body{font-family:system-ui;background:#101820;color:#fff;max-width:760px;margin:5rem auto;padding:0 1rem}h1{color:#ffd166}li{padding:.6rem 0;border-bottom:1px solid #304050}</style></head>
<body><h1>⚽ 365 Football Bot</h1><p>Football news automation dashboard</p><h2>Latest scraped news</h2><ul id="news"><li>Loading…</li></ul>
<script>fetch('/api/news').then(r=>r.json()).then(items=>{const list=document.querySelector('#news');list.replaceChildren();if(!items.length){const item=document.createElement('li');item.textContent='No news yet. Add an RSS source and wait for the monitor.';list.append(item);return}items.forEach(news=>{const item=document.createElement('li'),title=document.createElement('strong'),source=document.createElement('small');title.textContent=news.headline;source.textContent=news.source.name;item.append(title,document.createElement('br'),source);list.append(item)})}).catch(()=>{document.querySelector('#news').textContent='Unable to load news.'})</script>
</body></html>`;

export function createServer(db: PrismaClient, logger: Logger) {
  const app = Fastify({ loggerInstance: logger });
  app.get("/health", async () => ({ status: "ok" }));
  app.get("/api/news", async () => db.scrapedArticle.findMany({
    take: 25,
    orderBy: { createdAt: "desc" },
    select: { headline: true, summary: true, url: true, featuredImage: true, publishedAt: true, createdAt: true, source: { select: { name: true } } }
  }));
  app.get("/", async (_, reply) => reply.type("text/html; charset=utf-8").send(dashboard));
  return app;
}
