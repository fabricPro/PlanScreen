import { chromium } from "playwright";
const now = "2026-07-08T10:00:00Z";
const T = (id, ad, takim, sira) => ({
  id, ad, marka: "Stäubli", tip: "armür", cerceveSayisi: 16, maxTarakEniCm: "220",
  mekikSayisi: 4, esZamanliCozgu: 2, planTarihi: "2026-07-15T00:00:00Z", arsivlendi: false, sira,
  devir: null, durum: "dolu", takim, aciklama: null, notlar: null, createdAt: now,
});
const tezgahlar = [
  T("t1", "PLN 6,5 SIKLIK", "8+2 sıra tahar · 15 sıklık", 0),
  T("t2", "PLN 4 LENO", "4 çerçeve düz · 22 sıklık", 1),
];
const C = (id, tz, adKod, boy, tahar, cerceve, siklik, durum, sira, notlar) => ({
  id, tezgahId: tz, adKod, iplik: null, tarakNo: null, cozguSikligi: siklik, toplamTel: 4800,
  cozguBoyuM: boy, taharTipi: tahar, cerceveKullanim: cerceve, renkDizimi: null,
  tezgahSira: sira, durum, notlar, createdAt: `2026-07-08T10:0${sira}:00Z`,
});
const cozguler = [
  C("c1", "t1", "ÇZG-A", "120", "düz", 8, "40/2", "aktif", 0, "Bej zemin, öncelikli"),
  C("c2", "t1", "ÇZG-B", "80", "kırık", 10, "50/2", "sirada", 1, ""),
  C("c3", "t1", "ÇZG-C", "60", "düz", 6, "30/1", "taslak", 2, "Deneme çözgüsü"),
  C("c4", "t2", "ÇZG-D", "100", "leno", 4, "22", "aktif", 0, "Leno kontrol gerekli"),
];
const N = (id, cz, adKod, boy, durum, sira) => ({
  id, cozguId: cz, adKod, atkiIplikleri: [], atkiSikligi: null, orguSnapshotId: null,
  atkiRenkDizisi: [], tahminiBoyM: boy, durum, argeTalepKodu: null, argeTalepUrl: null,
  fasIlhamUrl: null, siraNo: sira, varyantSayisi: 0, aciklama: null, notlar: null, createdAt: now,
});
const numuneler = [
  // c1: 120 bütçe, 90 kullanılan
  N("n1", "c1", "NUM-1", "40", "dokundu", 0), N("n2", "c1", "NUM-2", "30", "sirada", 1),
  N("n3", "c1", "NUM-3", "20", "onayli", 2),
  // c2: 80 bütçe, 95 kullanılan → AŞIM
  N("n4", "c2", "NUM-4", "50", "dokunuyor", 0), N("n5", "c2", "NUM-5", "45", "onayli", 1),
  // c4: 100 bütçe, 40 kullanılan
  N("n6", "c4", "NUM-6", "40", "onayli", 0),
];
function ver(path) {
  if (path.endsWith("/tezgah")) return tezgahlar;
  if (path.endsWith("/cozgu")) return cozguler;
  if (path.endsWith("/numune")) return numuneler;
  if (path.includes("/gorev")) return [];
  return [];
}
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const [w, etiket] of [[1440, "tablet"], [1920, "masaustu"]]) {
  const page = await browser.newPage({ viewport: { width: w, height: 1000 } });
  await page.route("**/api/**", (r) =>
    r.fulfill({ contentType: "application/json", body: JSON.stringify(ver(new URL(r.request().url()).pathname)) }));
  await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
  await page.click("nav.tabs button:has-text('Analiz')");
  await page.waitForSelector(".analiz-tablo");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `scripts/analiz-${etiket}.png`, fullPage: false });
  await page.close();
}
// Baskı düzeni (print media) — 1920
const pp = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
await pp.route("**/api/**", (r) =>
  r.fulfill({ contentType: "application/json", body: JSON.stringify(ver(new URL(r.request().url()).pathname)) }));
await pp.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await pp.click("nav.tabs button:has-text('Analiz')");
await pp.waitForSelector(".analiz-tablo");
await pp.emulateMedia({ media: "print" });
await pp.waitForTimeout(200);
await pp.screenshot({ path: "scripts/analiz-baski.png", fullPage: true });
await pp.close();
console.log("yazıldı");
await browser.close();
