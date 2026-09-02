import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  await prisma.newsSource.upsert({
    where: { rssUrl: "https://www.espn.com/espn/rss/soccer/news" },
    update: {},
    create: { name: "ESPN Football", rssUrl: "https://www.espn.com/espn/rss/soccer/news", websiteUrl: "https://www.espn.com/soccer/" }
  });
}
main()
  .catch((error: unknown) => {
    console.error("Database seed failed", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
