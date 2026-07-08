import { chromium } from "playwright";
const now = "2026-07-08T10:00:00Z";
const T = (id, ad, sira, takim, aciklama) => ({
  id, ad, marka: "Stäubli", tip: "armur", cerceveSayisi: 8, maxTarakEniCm: "220",
  mekikSayisi: 2, esZamanliCozgu: 2, planTarihi: "2026-07-15T00:00:00Z", arsivlendi: false, sira,
  devir: 420, durum: "dolu", takim, aciklama, notlar: null, createdAt: now,
});
const tezgahlar = [
  T("t1", "PLN 6,5 SIKLIK", 0, "8+2 sıra tahar 15 sıklık",
    "**Dikkat:** çözgü gerginliği yüksek\n*sık kontrol* et\n* tahar sırası 8+2\n* mekik ayarı gözden geçir"),
  T("t2", "PLN 4 SIKLIK LENO", 1, "4 sıra tahar leno", null),
];
const C = (id, tz, adKod, sira) => ({
  id, tezgahId: tz, adKod, iplik: null, tarakNo: null, cozguSikligi: null, toplamTel: 4800,
  cozguBoyuM: "100", taharTipi: "duz", cerceveKullanim: 6, renkDizimi: null,
  tezgahSira: sira, durum: "aktif", notlar: null, createdAt: now,
});
const cozguler = [C("c1", "t1", "ÇZG-A", 0)];
const numuneler = [];
let gid = 0;
const gorevler = [
  { id: "g" + ++gid, tezgahId: "t1", numuneId: null, parentId: null, baslik: "Tahar kontrolü",
    tamamlandi: false, sonTarih: null, oncelik: 1, sira: 1, createdAt: now },
];
function ver(path) {
  if (path.endsWith("/tezgah")) return tezgahlar;
  if (path.endsWith("/cozgu")) return cozguler;
  if (path.endsWith("/numune")) return numuneler;
  if (path.includes("/gorev")) return gorevler;
  if (path.includes("/iplik")) return [];
  if (path.includes("/orgu")) return [];
  return [];
}
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.route("**/api/**", (r) =>
  r.fulfill({ contentType: "application/json", body: JSON.stringify(ver(new URL(r.request().url()).pathname)) }));
await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await page.waitForSelector(".serit");
await page.waitForTimeout(250);
// Panoda takım çipi görünür
await page.screenshot({ path: "scripts/tezgah-pano.png", fullPage: false });
// Sağ-tık → Detay / düzenle
await page.click(".serit:has-text('PLN 6,5 SIKLIK') h3 span", { button: "right" });
await page.waitForSelector(".baglam-menu");
await page.click(".baglam-menu button:has-text('Detay / düzenle')");
await page.waitForSelector(".tezgah-duzenle");
await page.waitForTimeout(250);
await page.screenshot({ path: "scripts/tezgah-duzenle.png", fullPage: false });
console.log("yazıldı");
await browser.close();
