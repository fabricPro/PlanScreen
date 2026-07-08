import { chromium } from "playwright";
const now = "2026-07-08T10:00:00Z";
const T = (id, ad, sira) => ({
  id, ad, marka: "Stäubli", tip: "armur", cerceveSayisi: 8, maxTarakEniCm: "200",
  mekikSayisi: 2, esZamanliCozgu: 2, planTarihi: null, arsivlendi: false, sira,
  devir: null, durum: "dolu", notlar: null, createdAt: now,
});
const tezgahlar = [T("t1", "Stäubli-1", 0)];
const C = (id, tz, adKod, durum, sira) => ({
  id, tezgahId: tz, adKod, iplik: null, tarakNo: null, cozguSikligi: null, toplamTel: 4800,
  cozguBoyuM: "100", taharTipi: "duz", cerceveKullanim: 6, renkDizimi: null,
  tezgahSira: sira, durum, notlar: null, createdAt: `2026-07-08T10:0${sira}:00Z`,
});
const cozguler = [C("c1", "t1", "ÇZG-A", "aktif", 0)];
const N = (id, cz, adKod, boy, durum, sira, varyant, aciklama) => ({
  id, cozguId: cz, adKod, atkiIplikleri: [], atkiSikligi: null, orguSnapshotId: null,
  atkiRenkDizisi: [], tahminiBoyM: String(boy), durum, argeTalepKodu: null, argeTalepUrl: null,
  fasIlhamUrl: null, siraNo: sira, varyantSayisi: varyant, aciklama, notlar: null,
  createdAt: `2026-07-08T10:0${sira}:00Z`,
});
const numuneler = [
  N("n1", "c1", "NUM-1", 30, "onayli", 0, 3,
    "**Atkı denemesi** — ekru + bej\n*İkinci varyantta* koyu ton dene\n* tarak sıklığı artır\n* fire payı bırak"),
  N("n2", "c1", "NUM-2", 25, "taslak", 1, 0, null),
];
function ver(path) {
  if (path.endsWith("/tezgah")) return tezgahlar;
  if (path.endsWith("/cozgu")) return cozguler;
  if (path.endsWith("/numune")) return numuneler;
  return [];
}
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 1180, height: 820 } });
await page.route("**/api/**", (r) =>
  r.fulfill({ contentType: "application/json", body: JSON.stringify(ver(new URL(r.request().url()).pathname)) }));
await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await page.waitForSelector(".serit");
// çözgü kartını aç
await page.click(".katla");
await page.waitForSelector(".numune-satir");
await page.waitForTimeout(200);

// 1) Hover ipucu — NUM-1 üstüne gel
await page.hover(".numune-satir:has-text('NUM-1')");
await page.waitForSelector(".numune-ipucu");
await page.waitForTimeout(200);
await page.screenshot({ path: "scripts/numune-ipucu.png", fullPage: false });

// 2) Detay / düzenle popover — sağ-tık → menü → Detay
await page.click(".numune-satir:has-text('NUM-1') .ad", { button: "right" });
await page.waitForSelector(".baglam-menu");
await page.click(".baglam-menu button:has-text('Detay / düzenle')");
await page.waitForSelector(".numune-detay");
await page.waitForTimeout(250);
await page.screenshot({ path: "scripts/numune-detay.png", fullPage: false });

console.log("yazıldı");
await browser.close();
