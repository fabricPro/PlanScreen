import { chromium } from "playwright";
const now = "2026-07-08T10:00:00Z";
// Bugün = 2026-07-08 (sabit referans mock verisiyle uyumlu)
const iso = (d) => `${d}T09:00:00Z`;
const T = (id, ad, sira) => ({
  id, ad, marka: "Stäubli", tip: "armur", cerceveSayisi: 8, maxTarakEniCm: "200",
  mekikSayisi: 2, esZamanliCozgu: 2, planTarihi: null, arsivlendi: false, sira,
  devir: null, durum: "dolu", notlar: null, createdAt: now,
});
const tezgahlar = [T("t1", "PLN 6,5 SIKLIK", 0), T("t2", "PLN 4 SIKLIK LENO", 1)];
const C = (id, tz, adKod) => ({
  id, tezgahId: tz, adKod, iplik: null, tarakNo: null, cozguSikligi: null, toplamTel: 4800,
  cozguBoyuM: "100", taharTipi: "duz", cerceveKullanim: 6, renkDizimi: null,
  tezgahSira: 0, durum: "aktif", notlar: null, createdAt: now,
});
const cozguler = [C("c1", "t1", "ÇZG-A"), C("c2", "t2", "ÇZG-C")];
const N = (id, cz, adKod) => ({
  id, cozguId: cz, adKod, atkiIplikleri: [], atkiSikligi: null, orguSnapshotId: null,
  atkiRenkDizisi: [], tahminiBoyM: "40", durum: "onayli", argeTalepKodu: null, argeTalepUrl: null,
  fasIlhamUrl: null, siraNo: 0, varyantSayisi: 0, aciklama: null, notlar: null, createdAt: now,
});
const numuneler = [N("n1", "c1", "1600 DN FR WOOL"), N("n2", "c2", "1200 TOW SLUB")];
let gid = 0;
const G = (baslik, opt = {}) => ({
  id: "g" + ++gid, tezgahId: opt.tezgah ?? null, numuneId: opt.numune ?? null,
  parentId: opt.parent ?? null, baslik, tamamlandi: opt.bitti ?? false,
  sonTarih: opt.tarih ? iso(opt.tarih) : null, oncelik: opt.onc ?? 1,
  sira: gid, createdAt: `2026-07-01T10:00:0${gid % 9}Z`,
});
const gorevler = [
  G("Çözgü ipliği siparişi ver", { tarih: "2026-07-05", onc: 2, tezgah: "t1" }), // gecikmiş
  G("Tahar kontrolü", { tarih: "2026-07-08", onc: 1, tezgah: "t1", numune: "n1" }), // bugün
  G("  → tarak numarası doğrula", { parent: "g2", tarih: "2026-07-08" }),
  G("  → çerçeve dizilimi", { parent: "g2", bitti: true }),
  G("Numune boyu ölç", { tarih: "2026-07-09", onc: 1, numune: "n2", tezgah: "t2" }), // yarın
  G("Haftalık ARGE toplantısı", { tarih: "2026-07-12", onc: 0 }), // bu hafta, bağımsız
  G("Yeni desen dosyalarını arşivle", { onc: 1 }), // tarihsiz, bağımsız
  G("Mekik ayarı yap", { tarih: "2026-07-20", onc: 2, tezgah: "t2" }), // sonra
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
for (const [ad, w, h] of [["masaustu", 1920, 1080], ["tablet", 1440, 900]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.route("**/api/**", (r) =>
    r.fulfill({ contentType: "application/json", body: JSON.stringify(ver(new URL(r.request().url()).pathname)) }));
  await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
  await page.click("nav.tabs button:has-text('Görevler')");
  await page.waitForSelector(".gorev-grup2");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `scripts/gorevler-tarih-${ad}.png`, fullPage: false });
  if (ad === "masaustu") {
    await page.click("nav.tabs.mini button:has-text('Tezgaha göre')");
    await page.waitForTimeout(250);
    await page.screenshot({ path: "scripts/gorevler-tezgah.png", fullPage: false });
  }
  await page.close();
}
console.log("yazıldı");
await browser.close();
