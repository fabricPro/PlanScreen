import { chromium } from "playwright";
const now = "2026-07-08T10:00:00Z";
const T = (id, ad, sira, plan) => ({
  id, ad, marka: "Stäubli", tip: "armur", cerceveSayisi: 8, maxTarakEniCm: "200",
  mekikSayisi: 2, esZamanliCozgu: 2, planTarihi: plan, arsivlendi: false, sira,
  devir: null, durum: "dolu", notlar: null, createdAt: now,
});
const tezgahlar = [
  T("t1", "Stäubli-1", 0, "2026-07-15T00:00:00Z"),
  T("t2", "Vamatex-2", 1, null),
  T("t3", "Dornier-3", 2, null),
];
const C = (id, tz, adKod, boy, sira) => ({
  id, tezgahId: tz, adKod, iplik: null, tarakNo: null, cozguSikligi: null, toplamTel: 4800,
  cozguBoyuM: String(boy), taharTipi: "duz", cerceveKullanim: 6, renkDizimi: null,
  tezgahSira: sira, durum: "aktif", notlar: null, createdAt: `2026-07-08T10:0${sira}:00Z`,
});
const cozguler = [
  C("c1", "t1", "ÇZG-A", 200, 0), C("c2", "t1", "ÇZG-B", 120, 1),
  C("c3", "t2", "ÇZG-C", 160, 0),
  C("c4", "t3", "ÇZG-D", 90, 0), C("c5", "t3", "ÇZG-E", 300, 1),
];
let nid = 0;
const N = (cz, adKod, boy, durum, varyant = 0, aciklama = null) => ({
  id: "n" + ++nid, cozguId: cz, adKod, atkiIplikleri: [], atkiSikligi: null, orguSnapshotId: null,
  atkiRenkDizisi: [], tahminiBoyM: String(boy), durum, argeTalepKodu: null, argeTalepUrl: null,
  fasIlhamUrl: null, siraNo: nid, varyantSayisi: varyant, aciklama, notlar: null,
  createdAt: `2026-07-08T10:00:0${nid % 9}Z`,
});
const numuneler = [
  // ÇZG-A (200m): dolu + biraz boş
  N("c1", "NUM-1", 60, "tamam", 0, "**Ekru** zemin denemesi\n*ilk parti* — sıklık artır\n* fire payı bırak"),
  N("c1", "NUM-2", 45, "dokunuyor"), N("c1", "NUM-3", 50, "onayli", 3),
  // ÇZG-B (120m): BÜTÇE AŞIMI (140 > 120)
  N("c2", "NUM-4", 70, "onayli"), N("c2", "NUM-5", 70, "taslak", 2),
  // ÇZG-C (160m): kısmi
  N("c3", "NUM-6", 40, "dokundu"), N("c3", "NUM-7", 30, "sirada"),
  // ÇZG-D (90m): küçük parçalar + iptal
  N("c4", "NUM-8", 25, "tamam"), N("c4", "NUM-9", 10, "iptal"), N("c4", "NUM-10", 30, "onayli"),
  // ÇZG-E (300m): tek büyük + boş
  N("c5", "NUM-11", 120, "dokunuyor", 0, "Uzun parti — *dikkat*: renk geçişi"),
];
function ver(path) {
  if (path.endsWith("/tezgah")) return tezgahlar;
  if (path.endsWith("/cozgu")) return cozguler;
  if (path.endsWith("/numune")) return numuneler;
  return [];
}
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const [ad, w, h] of [["tablet", 1440, 900], ["masaustu", 1920, 1080]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.route("**/api/**", (r) =>
    r.fulfill({ contentType: "application/json", body: JSON.stringify(ver(new URL(r.request().url()).pathname)) }));
  await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
  await page.click("nav.tabs button:has-text('Çizelge')");
  await page.waitForSelector(".cizelge-lane");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `scripts/cizelge-${ad}.png`, fullPage: false });
  if (ad === "masaustu") {
    // hover ipucu
    await page.hover(".is-emri:has-text('NUM-1')");
    await page.waitForSelector(".numune-ipucu");
    await page.waitForTimeout(200);
    await page.screenshot({ path: "scripts/cizelge-ipucu.png", fullPage: false });
  }
  await page.close();
}
console.log("yazıldı");
await browser.close();
