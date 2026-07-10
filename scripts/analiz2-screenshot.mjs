import { chromium } from "playwright";
const now = "2026-07-08T10:00:00Z";
const T = (id, ad, takim, sira, arsivlendi = false) => ({
  id, ad, marka: "Stäubli", tip: "armür", cerceveSayisi: 16, maxTarakEniCm: "220",
  mekikSayisi: 4, esZamanliCozgu: 2, planTarihi: "2026-07-15T00:00:00Z", arsivlendi, sira,
  devir: null, durum: "dolu", takim, aciklama: null, notlar: null, createdAt: now,
});
const tezgahlar = [
  T("t1", "PLN 6,5 SIKLIK", "8+2 sıra tahar · 15 sıklık", 0),
  T("t2", "PLN 4 LENO", "4 çerçeve düz · 22 sıklık", 1),
  T("t3", "PLN ESKI", "—", 2, true), // arşivli
];
const C = (id, tz, adKod, boy, tahar, cerceve, siklik, durum, sira, notlar) => ({
  id, tezgahId: tz, adKod, iplik: null, tarakNo: null, cozguSikligi: siklik, toplamTel: 4800,
  cozguBoyuM: boy, taharTipi: tahar, cerceveKullanim: cerceve, renkDizimi: null,
  tezgahSira: sira, durum, notlar, createdAt: `2026-07-08T10:0${sira}:00Z`,
});
const cozguler = [
  C("c1", "t1", "ÇZG-A", "120", "duz", 8, "40/2", "aktif", 0, "Bej zemin, öncelikli"),
  C("c2", "t1", "ÇZG-B", "80", "kirik", 10, "50/2", "sirada", 1, ""),
  C("c4", "t2", "ÇZG-D", "100", "dalgali", 4, "22", "aktif", 0, "Leno kontrol gerekli"),
];
const N = (id, cz, adKod, boy, durum, sira) => ({
  id, cozguId: cz, adKod, atkiIplikleri: [], atkiSikligi: null, orguSnapshotId: null,
  atkiRenkDizisi: [], tahminiBoyM: boy, durum, argeTalepKodu: null, argeTalepUrl: null,
  fasIlhamUrl: null, siraNo: sira, varyantSayisi: 0, aciklama: null, notlar: null, createdAt: now,
});
const numuneler = [
  N("n1", "c1", "NUM-1", "40", "dokundu", 0), N("n2", "c1", "NUM-2", "30", "sirada", 1),
  N("n4", "c2", "NUM-4", "50", "dokunuyor", 0), N("n5", "c2", "NUM-5", "45", "onayli", 1),
  N("n6", "c4", "NUM-6", "40", "onayli", 0),
];
const iplikler = [
  { id: "i1", tezgahId: "t1", ad: "Bej pamuk", tip: "pamuk", renk: "#DCC29B", renkAdi: "Bej", numara: "30/2", notlar: null, createdAt: now },
  { id: "i2", tezgahId: "t1", ad: "Antrasit", tip: "polyester", renk: "#3a3f45", renkAdi: "Antrasit", numara: "50/2", notlar: null, createdAt: now },
];
function ver(path, url) {
  if (path.endsWith("/tezgah")) return tezgahlar;
  if (path.endsWith("/cozgu")) return cozguler;
  if (path.endsWith("/numune")) return numuneler;
  if (path.endsWith("/iplik")) {
    const tz = new URL(url).searchParams.get("tezgahId");
    return tz ? iplikler.filter((i) => i.tezgahId === tz) : iplikler;
  }
  if (path.includes("/gorev")) return [];
  return [];
}
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
async function mkPage(w, h) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.route("**/api/**", (r) => {
    const u = r.request().url();
    r.fulfill({ contentType: "application/json", body: JSON.stringify(ver(new URL(u).pathname, u)) });
  });
  return page;
}

// --- Masaüstü 1440: Analiz + düzenleme pencereleri ---
let page = await mkPage(1440, 1000);
await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await page.click("nav.tabs button:has-text('Analiz')");
await page.waitForSelector(".analiz-tablo");
await page.waitForTimeout(300);
// Arşivlenenler aç
await page.click(".analiz-arsiv-baslik");
await page.waitForTimeout(150);
await page.screenshot({ path: "scripts/analiz2-masaustu.png", fullPage: false });
// Çözgü ✎ → CozguDuzenle
await page.click(".analiz-tablo tbody tr:first-child .analiz-duzenle-dugme");
await page.waitForSelector(".cozgu-duzenle");
await page.waitForTimeout(200);
await page.screenshot({ path: "scripts/analiz2-cozgu-duzenle.png", fullPage: false });
await page.keyboard.press("Escape");
// Tezgah ✎ → TezgahDuzenle (iplik havuzu bölümü)
await page.click(".analiz-tezgah-bar .analiz-duzenle-dugme");
await page.waitForSelector(".tezgah-duzenle");
await page.waitForSelector(".tezgah-iplikler");
await page.waitForTimeout(250);
await page.screenshot({ path: "scripts/analiz2-tezgah-duzenle.png", fullPage: false });
await page.close();

// --- Telefon 390×844: nav kaydırma, Pano tek kolon, Analiz kompakt ---
page = await mkPage(390, 844);
await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await page.waitForSelector(".serit");
await page.waitForTimeout(300);
await page.screenshot({ path: "scripts/analiz2-tel-pano.png", fullPage: false });
await page.click("nav.tabs button:has-text('Analiz')");
await page.waitForSelector(".analiz-tablo");
await page.waitForTimeout(250);
await page.screenshot({ path: "scripts/analiz2-tel-analiz.png", fullPage: false });
await page.close();

console.log("yazıldı");
await browser.close();
