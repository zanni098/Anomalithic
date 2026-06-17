import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("docs/media", { recursive: true });

const pages = [
  { url: "https://anomalithic.vercel.app", file: "home.png" },
  { url: "https://anomalithic.vercel.app/product", file: "product.png" },
  { url: "https://anomalithic.vercel.app/builder", file: "builder.png" },
  { url: "https://anomalithic.vercel.app/earn", file: "earn.png" },
  { url: "https://anomalithic.vercel.app/docs", file: "docs.png" },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

for (const { url, file } of pages) {
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `docs/media/${file}`, fullPage: false });
  console.log(`✓ ${file}`);
  await page.close();
}

// Desktop app (served locally)
const dp = await ctx.newPage();
await dp.goto("http://localhost:8899/", { waitUntil: "networkidle" });
await dp.waitForTimeout(1500);
await dp.screenshot({ path: "docs/media/desktop.png" });
console.log("✓ desktop.png");
await dp.close();

await browser.close();
console.log("All screenshots saved to docs/media/");
