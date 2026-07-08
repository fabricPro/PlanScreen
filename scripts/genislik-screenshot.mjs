import { chromium } from "playwright";
const now = "2026-07-08T10:00:00Z";
const T = (id, ad, sira) => ({
  id, ad, marka: "Stäubli", tip: "armur", cerceveSayisi: 8, maxTarakEniCm: "200",
  mekikSayisi: 2, esZamanliCozgu: 2, planTarihi: null, arsivlendi: false, sira,
  devir: null, durum: "dolu", notlar: null, createdAt: now,
});
const tezgahlar = [
  T("t1", "Stäubli-1", 0), T("t2", "Vamatex-2", 1),
  T("t3", "Dornier-3", 2), T("t4", "Picanol-4", 3), T("t5", "Somet-5", 4),
];
const C = (id, tz, adKod, durum, sira) => ({
  id, tezgahId: tz, adKod, iplik: null, tarakNo: null, cozguSikligi: null, toplamTel: 4800,
  cozguBoyuM: "100", taharTipi: "duz", cerceveKullanim: 6, renkDizimi: null,
  tezgahSira: sira, durum, notlar: null, createdAt: `2026-07-08T10:0${sira}:00Z`,
});
const cozguler = [
  C("c1", "t1", "ÇZG-A", "aktif", 0), C("c2", "t1", "ÇZG-B", "taslak", 1),
  C("c3", "t2", "ÇZG-C", "aktif", 0), C("c4", "t3", "ÇZG-D", "aktif", 0),
  C("c5", "t4", "ÇZG-E", "taslak", 0),
];
const N = (id, cz, adKod, boy, durum, sira) => ({
  id, cozguId: cz, adKod, atkiIplikleri: [], atkiSikligi: null, orguSnapshotId: null,
  atkiRenkDizisi: [], tahminiBoyM: String(boy), durum, argeTalepKodu: null, argeTalepUrl: null,
  fasIlhamUrl: null, siraNo: sira, varyantSayisi: 0, aciklama: null, notlar: null,
  createdAt: `2026-07-08T10:0${sira}:00Z`,
});
const numuneler = [
  N("n1", "c1", "NUM-1", 30, "onayli", 0), N("n2", "c3", "NUM-2", 25, "sirada", 0),
  N("n3", "c4", "NUM-3", 40, "onayli", 0),
];
function ver(path) {
  if (path.endsWith("/tezgah")) return tezgahlar;
  if (path.endsWith("/cozgu")) return cozguler;
  if (path.endsWith("/numune")) return numuneler;
  return [];
}
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const [ad, w, h] of [["tablet-1440", 1440, 900], ["masaustu-1920", 1920, 1080]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.route("**/api/**", (r) =>
    r.fulfill({ contentType: "application/json", body: JSON.stringify(ver(new URL(r.request().url()).pathname)) }));
  await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
  await page.waitForSelector(".serit");
  await page.waitForTimeout(200);
  await page.screenshot({ path: `scripts/genislik-${ad}.png`, fullPage: false });
  await page.close();
}
console.log("yazıldı");
await browser.close();
