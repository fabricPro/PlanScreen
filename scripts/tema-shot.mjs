import { chromium } from "playwright";
const now = "2026-07-08T10:00:00Z";
const tezgahlar = [
  { id: "t1", ad: "PLN 6,5 SIKLIK", marka: "Stäubli", tip: "armür", cerceveSayisi: 16, maxTarakEniCm: "220", mekikSayisi: 4, esZamanliCozgu: 2, planTarihi: "2026-07-15T00:00:00Z", arsivlendi: false, sira: 0, devir: null, durum: "dolu", takim: "8+2 sıra tahar · 15 sıklık", aciklama: null, notlar: null, createdAt: now },
  { id: "t2", ad: "PLN 4 LENO", marka: "Stäubli", tip: "armür", cerceveSayisi: 8, maxTarakEniCm: "190", mekikSayisi: 2, esZamanliCozgu: 2, planTarihi: null, arsivlendi: false, sira: 1, devir: null, durum: "bos", takim: null, aciklama: null, notlar: null, createdAt: now },
];
const cozguler = [
  { id: "c1", tezgahId: "t1", adKod: "ÇZG-A", iplik: null, tarakNo: null, cozguSikligi: "40/2", toplamTel: 4800, cozguBoyuM: "120", taharTipi: "duz", cerceveKullanim: 8, renkDizimi: null, tezgahSira: 0, durum: "aktif", notlar: null, createdAt: now },
];
const numuneler = [
  { id: "n1", cozguId: "c1", adKod: "NUM-1", atkiIplikleri: [], atkiSikligi: null, orguSnapshotId: null, atkiRenkDizisi: [], tahminiBoyM: "40", durum: "onayli", argeTalepKodu: null, argeTalepUrl: null, fasIlhamUrl: null, siraNo: 0, varyantSayisi: 0, aciklama: null, notlar: null, createdAt: now },
];
function ver(p) {
  if (p.endsWith("/tezgah")) return tezgahlar;
  if (p.endsWith("/cozgu")) return cozguler;
  if (p.endsWith("/numune")) return numuneler;
  if (p.endsWith("/iplik")) return [];
  if (p.includes("/gorev")) return [];
  return [];
}
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
// colorScheme:light → ilk boya aydınlık başlar
const page = await b.newPage({ viewport: { width: 1200, height: 820 }, colorScheme: "light" });
await page.route("**/api/**", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify(ver(new URL(r.request().url()).pathname)) }));
await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await page.waitForSelector(".tema-toggle");
await page.waitForTimeout(300);
await page.screenshot({ path: "scripts/tema-aydinlik.png", fullPage: false });
// Karanlığa geç
await page.click(".tema-toggle");
await page.waitForTimeout(250);
await page.screenshot({ path: "scripts/tema-karanlik.png", fullPage: false });
const attr = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
const ls = await page.evaluate(() => localStorage.getItem("ndp-tema"));
console.log("toggle sonrası data-theme:", attr, "| localStorage:", ls);
// Kalıcılık: yeniden yükle → karanlık kalmalı
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector(".serit");
await page.waitForTimeout(250);
const attr2 = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
console.log("reload sonrası data-theme:", attr2);
await page.close();
console.log("ok");
await b.close();
