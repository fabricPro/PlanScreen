import { chromium } from "playwright";
const now = "2026-07-08T10:00:00Z";
const T = (id, ad, sira, plan, ars) => ({
  id, ad, marka: "Stäubli", tip: "armur", cerceveSayisi: 8, maxTarakEniCm: "200",
  mekikSayisi: 2, esZamanliCozgu: 2, planTarihi: plan, arsivlendi: ars, sira,
  devir: null, durum: "dolu", notlar: null, createdAt: now,
});
const tezgahlar = [
  T("t1", "Stäubli-1", 0, "2026-07-15T00:00:00Z", false),
  T("t2", "Vamatex-2", 1, null, false),
  T("t3", "Eski-Plan", 2, "2026-06-01T00:00:00Z", true), // arşivli → panoda görünmez
];
const C = (id, tz, adKod, durum, sira) => ({
  id, tezgahId: tz, adKod, iplik: null, tarakNo: null, cozguSikligi: null, toplamTel: 4800,
  cozguBoyuM: "100", taharTipi: "duz", cerceveKullanim: 6, renkDizimi: null,
  tezgahSira: sira, durum, notlar: null, createdAt: `2026-07-08T10:0${sira}:00Z`,
});
const cozguler = [C("c1", "t1", "ÇZG-A", "aktif", 0), C("c2", "t1", "ÇZG-B", "taslak", 1), C("c3", "t2", "ÇZG-C", "aktif", 0)];
const N = (id, cz, adKod, boy, durum, sira) => ({
  id, cozguId: cz, adKod, atkiIplikleri: [], atkiSikligi: null, orguSnapshotId: null,
  atkiRenkDizisi: [], tahminiBoyM: String(boy), durum, argeTalepKodu: null, argeTalepUrl: null,
  fasIlhamUrl: null, siraNo: sira, notlar: null, createdAt: `2026-07-08T10:0${sira}:00Z`,
});
const numuneler = [N("n1", "c1", "NUM-1", 30, "onayli", 0), N("n2", "c1", "NUM-2", 25, "taslak", 1), N("n3", "c3", "NUM-3", 40, "sirada", 0)];
function ver(path, s) {
  if (path.endsWith("/tezgah")) return tezgahlar;
  if (path.endsWith("/cozgu")) return cozguler;
  if (path.endsWith("/numune")) return numuneler;
  return [];
}
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 1180, height: 760 } });
await page.route("**/api/**", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify(ver(new URL(r.request().url()).pathname)) }));
await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await page.waitForSelector(".serit");
await page.waitForTimeout(250);
await page.screenshot({ path: "scripts/pano2-katli.png", fullPage: false });
// bir çözgü kartını aç
await page.click(".katla");
await page.waitForTimeout(250);
await page.screenshot({ path: "scripts/pano2-acik.png", fullPage: false });
console.log("yazıldı");
await browser.close();
