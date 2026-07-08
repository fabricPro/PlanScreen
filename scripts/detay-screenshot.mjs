import { chromium } from "playwright";
const now = "2026-07-08T10:00:00Z";
const T = (id, ad, sira) => ({
  id, ad, marka: "Stäubli", tip: "armur", cerceveSayisi: 8, maxTarakEniCm: "200",
  mekikSayisi: 2, esZamanliCozgu: 2, planTarihi: null, arsivlendi: false, sira,
  devir: null, durum: "dolu", notlar: null, createdAt: now,
});
const tezgahlar = [T("t1", "Stäubli-1", 0)];
const C = (id, tz, adKod, sira) => ({
  id, tezgahId: tz, adKod, iplik: null, tarakNo: null, cozguSikligi: null, toplamTel: 4800,
  cozguBoyuM: "100", taharTipi: "duz", cerceveKullanim: 6, renkDizimi: null,
  tezgahSira: sira, durum: "aktif", notlar: null, createdAt: `2026-07-08T10:0${sira}:00Z`,
});
const cozguler = [C("c1", "t1", "ÇZG-A", 0)];
const N = (id, adKod, boy, durum, varyant, aciklama) => ({
  id, cozguId: "c1", adKod, atkiIplikleri: [], atkiSikligi: null, orguSnapshotId: null,
  atkiRenkDizisi: [], tahminiBoyM: String(boy), durum, argeTalepKodu: null, argeTalepUrl: null,
  fasIlhamUrl: null, siraNo: 0, varyantSayisi: varyant, aciklama, notlar: null, createdAt: now,
});
const numuneler = [
  N("n1", "NUM-1", 40, "onayli", 3, "**Ekru** zemin\n*ilk parti* denemesi\n* sıklık artır\n* fire payı"),
];
function ver(path) {
  if (path.endsWith("/tezgah")) return tezgahlar;
  if (path.endsWith("/cozgu")) return cozguler;
  if (path.endsWith("/numune")) return numuneler;
  return [];
}
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });

async function ac(page) {
  await page.route("**/api/**", (r) =>
    r.fulfill({ contentType: "application/json", body: JSON.stringify(ver(new URL(r.request().url()).pathname)) }));
  await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
  await page.waitForSelector(".serit");
  await page.click(".katla");
  await page.waitForSelector(".numune-satir");
  await page.click(".numune-satir:has-text('NUM-1') .ad", { button: "right" });
  await page.waitForSelector(".baglam-menu");
  await page.click(".baglam-menu button:has-text('Detay / düzenle')");
  await page.waitForSelector(".numune-detay");
  await page.waitForTimeout(200);
}

// Masaüstü 1920 — 2 sütun
let page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await ac(page);
await page.screenshot({ path: "scripts/detay-masaustu.png", fullPage: false });
// Dış tık kapatmıyor mu? Boş bir yere tıkla
await page.mouse.click(1500, 800);
await page.waitForTimeout(150);
const acikMi = await page.locator(".numune-detay").count();
console.log("dış tık sonrası pencere sayısı:", acikMi, "(1 = kapanmadı, doğru)");
// Başlıktan sürükle
const bar = await page.locator(".detay-bar").boundingBox();
await page.mouse.move(bar.x + 60, bar.y + 12);
await page.mouse.down();
await page.mouse.move(bar.x - 260, bar.y + 230, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(150);
await page.screenshot({ path: "scripts/detay-tasindi.png", fullPage: false });
await page.close();

// Tablet 1440 — 2 sütun
page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await ac(page);
await page.screenshot({ path: "scripts/detay-tablet.png", fullPage: false });
await page.close();

console.log("yazıldı");
await browser.close();
