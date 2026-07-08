// icon.svg → PNG (Playwright/Chromium ile). PWA icon boyutları.
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const svg = readFileSync("public/icon.svg", "utf8");
const boyutlar = [
  { ad: "public/pwa-192.png", px: 192 },
  { ad: "public/pwa-512.png", px: 512 },
  { ad: "public/apple-touch-icon.png", px: 180 },
];

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});
const page = await browser.newPage();

for (const { ad, px } of boyutlar) {
  await page.setViewportSize({ width: px, height: px });
  const html = `<!doctype html><html><body style="margin:0">
    <div style="width:${px}px;height:${px}px">${svg.replace(/width="512"/, `width="${px}"`).replace(/height="512"/, `height="${px}"`)}</div>
  </body></html>`;
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.locator("svg").screenshot({ path: ad });
  console.log("✓", ad, px + "px");
}

await browser.close();
