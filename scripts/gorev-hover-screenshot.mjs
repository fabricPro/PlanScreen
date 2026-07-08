import { chromium } from "playwright";
const now = "2026-07-08T10:00:00Z";
const iso = (d) => `${d}T09:00:00Z`;
const T = (id, ad, sira) => ({
  id, ad, marka: "Stäubli", tip: "armur", cerceveSayisi: 8, maxTarakEniCm: "220",
  mekikSayisi: 2, esZamanliCozgu: 2, planTarihi: null, arsivlendi: false, sira,
  devir: null, durum: "dolu", takim: null, aciklama: null, notlar: null, createdAt: now,
});
const tezgahlar = [T("t1", "PLN 6,5 SIKLIK", 0)];
const cozguler = [{
  id: "c1", tezgahId: "t1", adKod: "ÇZG-A", iplik: null, tarakNo: null, cozguSikligi: null,
  toplamTel: 4800, cozguBoyuM: "100", taharTipi: "duz", cerceveKullanim: 6, renkDizimi: null,
  tezgahSira: 0, durum: "aktif", notlar: null, createdAt: now,
}];
const numuneler = [];
let gid = 0;
const G = (baslik, opt = {}) => ({
  id: "g" + ++gid, tezgahId: "t1", numuneId: null, parentId: opt.parent ?? null, baslik,
  tamamlandi: opt.bitti ?? false, sonTarih: opt.tarih ? iso(opt.tarih) : null,
  oncelik: opt.onc ?? 1, sira: gid, createdAt: `2026-07-01T10:00:0${gid % 9}Z`,
});
const gorevler = [
  G("Çözgü ipliği siparişi", { onc: 2, tarih: "2026-07-05" }),
  G("Tahar kontrolü", { onc: 1, tarih: "2026-07-08" }),
  G("  alt: tarak numarası", { parent: "g2" }),
  G("Mekik ayarı", { onc: 0 }),
  G("Eski planı temizle", { bitti: true, tarih: "2026-07-06" }),
];
function ver(path) {
  if (path.endsWith("/tezgah")) return tezgahlar;
  if (path.endsWith("/cozgu")) return cozguler;
  if (path.endsWith("/numune")) return numuneler;
  if (path.includes("/gorev")) return gorevler;
  return [];
}
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.route("**/api/**", (r) =>
  r.fulfill({ contentType: "application/json", body: JSON.stringify(ver(new URL(r.request().url()).pathname)) }));
await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await page.waitForSelector(".gorev-ozet");
await page.hover(".gorev-ozet");
await page.waitForSelector(".gorev-ipucu");
await page.waitForTimeout(250);
await page.screenshot({ path: "scripts/gorev-hover.png", fullPage: false });
console.log("yazıldı");
await browser.close();
