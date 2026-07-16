import { chromium } from "playwright";
const now = "2026-07-08T10:00:00Z";
const tezgahlar = [
  { id: "t1", ad: "PLN 6,5 SIKLIK", marka: "Stäubli", tip: "armür", cerceveSayisi: 16, maxTarakEniCm: "220", mekikSayisi: 4, esZamanliCozgu: 2, planTarihi: null, arsivlendi: false, sira: 0, devir: null, durum: "dolu", takim: null, aciklama: null, notlar: null, createdAt: now },
];
const C = (id, adKod, durum, sira) => ({ id, tezgahId: "t1", adKod, iplik: null, tarakNo: null, cozguSikligi: "40/2", toplamTel: 4800, cozguBoyuM: "120", taharTipi: "duz", cerceveKullanim: 8, renkDizimi: null, tezgahSira: sira, durum, notlar: null, createdAt: `2026-07-08T10:0${sira}:00Z` });
const cozguler = [
  C("c1", "ÇZG-A", "aktif", 0),
  C("c2", "ÇZG-B", "sirada", 1),
  C("c3", "ÇZG-C", "tamam", 2),
  C("c4", "ÇZG-D", "tamam", 3),
];
function ver(p) {
  if (p.endsWith("/tezgah")) return tezgahlar;
  if (p.endsWith("/cozgu")) return cozguler;
  if (p.endsWith("/numune")) return [];
  if (p.endsWith("/iplik")) return [];
  if (p.includes("/gorev")) return [];
  return [];
}
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await b.newPage({ viewport: { width: 1100, height: 820 } });
await page.route("**/api/**", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify(ver(new URL(r.request().url()).pathname)) }));
await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await page.waitForSelector(".cozgu-kart");
await page.waitForTimeout(300);
// Varsayılan: 2 tamam gizli
const gizli = await page.locator(".cozgu-kart").count();
console.log("varsayılan görünen çözgü kartı:", gizli, "(2 olmalı)");
await page.screenshot({ path: "scripts/cozgu-tamam-gizli.png", fullPage: false });
// Toggle → tamamlananlar görünür
await page.click(".pano-arac .small:has-text('Tamamlananları göster')");
await page.waitForTimeout(200);
const acik = await page.locator(".cozgu-kart").count();
console.log("toggle sonrası görünen çözgü kartı:", acik, "(4 olmalı)");
await page.screenshot({ path: "scripts/cozgu-tamam-goster.png", fullPage: false });
await page.close();
console.log("ok");
await b.close();
