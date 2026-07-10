import { chromium } from "playwright";
const now = "2026-07-08T10:00:00Z";
const tezgahlar = [{ id: "t1", ad: "PLN 6,5 SIKLIK", marka: "Stäubli", tip: "armür", cerceveSayisi: 16, maxTarakEniCm: "220", mekikSayisi: 4, esZamanliCozgu: 2, planTarihi: null, arsivlendi: false, sira: 0, devir: null, durum: "dolu", takim: "8+2 sıra tahar", aciklama: null, notlar: null, createdAt: now }];
const cozguler = [{ id: "c1", tezgahId: "t1", adKod: "ÇZG-A", iplik: null, tarakNo: null, cozguSikligi: "40/2", toplamTel: 4800, cozguBoyuM: "120", taharTipi: "duz", cerceveKullanim: 8, renkDizimi: null, tezgahSira: 0, durum: "aktif", notlar: null, createdAt: now }];
const iplikler = [
  { id: "i1", tezgahId: "t1", ad: "Bej pamuk", tip: "pamuk", renk: "#DCC29B", renkAdi: "Bej", numara: "30/2", notlar: null, createdAt: now },
  { id: "i2", tezgahId: "t1", ad: "Antrasit polyester", tip: "polyester", renk: "#3a3f45", renkAdi: "Antrasit", numara: "50/2", notlar: null, createdAt: now },
];
function ver(p) {
  if (p.endsWith("/tezgah")) return tezgahlar;
  if (p.endsWith("/cozgu")) return cozguler;
  if (p.endsWith("/numune")) return [];
  if (p.endsWith("/iplik")) return iplikler;
  if (p.includes("/gorev")) return [];
  return [];
}
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await page.route("**/api/**", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify(ver(new URL(r.request().url()).pathname)) }));
await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await page.click("nav.tabs button:has-text('Analiz')");
await page.waitForSelector(".analiz-tablo");
await page.click(".analiz-tezgah-bar .analiz-duzenle-dugme");
await page.waitForSelector(".tezgah-iplikler");
await page.waitForTimeout(200);
await page.evaluate(() => {
  const g = document.querySelector(".tezgah-duzenle .detay-govde");
  if (g) g.scrollTop = 99999;
});
await page.waitForTimeout(200);
await page.screenshot({ path: "scripts/analiz2-iplik-bolum.png", fullPage: false });
console.log("ok");
await b.close();
