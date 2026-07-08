import { chromium } from "playwright";
const now = "2026-07-08T10:00:00Z";
const iso = (d) => `${d}T09:00:00Z`;
const T = (id, ad, sira) => ({
  id, ad, marka: "Stäubli", tip: "armur", cerceveSayisi: 8, maxTarakEniCm: "220",
  mekikSayisi: 2, esZamanliCozgu: 2, planTarihi: null, arsivlendi: false, sira,
  devir: null, durum: "dolu", takim: null, aciklama: null, notlar: null, createdAt: now,
});
const tezgahlar = [T("t1", "PLN 6,5 SIKLIK", 0), T("t2", "PLN 4 LENO", 1)];
const C = (id, tz, adKod, sira) => ({
  id, tezgahId: tz, adKod, iplik: null, tarakNo: null, cozguSikligi: null, toplamTel: 4800,
  cozguBoyuM: "100", taharTipi: "duz", cerceveKullanim: 6, renkDizimi: null,
  tezgahSira: sira, durum: "aktif", notlar: null, createdAt: `2026-07-08T10:0${sira}:00Z`,
});
const cozguler = [
  C("c1", "t1", "ÇZG-A", 0), C("c2", "t1", "ÇZG-B", 1), C("c3", "t1", "ÇZG-C(boş)", 2),
  C("c4", "t2", "ÇZG-D", 0),
];
const N = (id, cz, adKod, sira) => ({
  id, cozguId: cz, adKod, atkiIplikleri: [], atkiSikligi: null, orguSnapshotId: null,
  atkiRenkDizisi: [], tahminiBoyM: "40", durum: "onayli", argeTalepKodu: null, argeTalepUrl: null,
  fasIlhamUrl: null, siraNo: sira, varyantSayisi: 0, aciklama: null, notlar: null, createdAt: now,
});
const numuneler = [N("n1", "c1", "NUM-1", 0), N("n2", "c1", "NUM-2", 1), N("n3", "c4", "NUM-3", 0)];
let gid = 0;
const G = (baslik, opt = {}) => ({
  id: "g" + ++gid, tezgahId: opt.tz ?? null, cozguId: opt.cz ?? null, numuneId: opt.nm ?? null,
  parentId: null, baslik, tamamlandi: opt.bitti ?? false,
  sonTarih: opt.tarih ? iso(opt.tarih) : null, oncelik: opt.onc ?? 1, sira: gid, createdAt: now,
});
const gorevler = [
  G("Çözgü A tahar kontrolü", { tz: "t1", cz: "c1", onc: 2, tarih: "2026-07-09" }),
  G("Çözgü A numune boyu ölç", { tz: "t1", cz: "c1", nm: "n1" }),
  G("Çözgü B mekik ayarı", { tz: "t1", cz: "c2", onc: 1 }),
  G("Tezgah geneli bakım", { tz: "t1", onc: 0 }),
  G("Çözgü D leno kontrol", { tz: "t2", cz: "c4", onc: 1, tarih: "2026-07-10" }),
];
function ver(path) {
  if (path.endsWith("/tezgah")) return tezgahlar;
  if (path.endsWith("/cozgu")) return cozguler;
  if (path.endsWith("/numune")) return numuneler;
  if (path.includes("/gorev")) return gorevler;
  return [];
}
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
await page.route("**/api/**", (r) =>
  r.fulfill({ contentType: "application/json", body: JSON.stringify(ver(new URL(r.request().url()).pathname)) }));
await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await page.click("nav.tabs button:has-text('Görevler')");
await page.waitForSelector(".gorev-cozgu-blok");
await page.waitForTimeout(300);
await page.screenshot({ path: "scripts/gorev-cozgu.png", fullPage: false });
// Ekleme çubuğunda tezgah seç → çözgü dolu görünsün
await page.selectOption(".gorev-ekle-bar select[title='Tezgah']", "t1");
await page.waitForTimeout(150);
await page.screenshot({ path: "scripts/gorev-cozgu-secici.png", fullPage: false });
console.log("yazıldı");
await browser.close();
