import { chromium } from "playwright";

const now = "2026-07-08T10:00:00Z";
const t = (i) => `2026-07-08T10:0${i}:00Z`;

const tezgahlar = [
  { id: "t1", ad: "Stäubli-1", marka: "Stäubli", tip: "armur", cerceveSayisi: 8, maxTarakEniCm: "200", mekikSayisi: 2, esZamanliCozgu: 2, devir: null, durum: "dolu", notlar: null, createdAt: now },
];

const C = (id, adKod, durum, sira) => ({
  id, tezgahId: "t1", adKod, iplik: null, tarakNo: null, cozguSikligi: null,
  toplamTel: 4800, cozguBoyuM: "100", taharTipi: "duz", cerceveKullanim: 6,
  renkDizimi: null, tezgahSira: sira, durum, notlar: null, createdAt: t(sira),
});
const cozguler = [
  C("c1", "ÇZG-A", "aktif", 0),
  C("c2", "ÇZG-B", "aktif", 1),
  C("c3", "ÇZG-C", "aktif", 2),
  C("c4", "ÇZG-D", "taslak", 3),
];

const iplikler = [
  { id: "i1", tezgahId: "t1", ad: "Bej pamuk", tip: "pamuk", renk: "#DCC29B", renkAdi: "Bej — Orta", numara: "30/2", notlar: null, createdAt: t(0) },
  { id: "i2", tezgahId: "t1", ad: "Kahve", tip: "pamuk", renk: "#8A5A38", renkAdi: "Kahve — Orta", numara: "20/1", notlar: null, createdAt: t(1) },
  { id: "i3", tezgahId: "t1", ad: "Gri", tip: "polyester", renk: "#B6BABF", renkAdi: "Gri — Orta", numara: "40/2", notlar: null, createdAt: t(2) },
  { id: "i4", tezgahId: "t1", ad: "Ekru", tip: "pamuk", renk: "#EBE3CE", renkAdi: "Ekru — Orta", numara: "30/2", notlar: null, createdAt: t(3) },
];

const numuneler = [
  { id: "n1", cozguId: "c1", adKod: "NUM-1", atkiIplikleri: [{ iplikId: "i1", ad: "Bej pamuk", renk: "#DCC29B" }], atkiSikligi: null, orguSnapshotId: null, atkiRenkDizisi: ["#DCC29B"], tahminiBoyM: "30", durum: "onayli", argeTalepKodu: null, argeTalepUrl: null, fasIlhamUrl: null, siraNo: 0, notlar: null, createdAt: t(0) },
  { id: "n2", cozguId: "c1", adKod: "NUM-2", atkiIplikleri: [], atkiSikligi: null, orguSnapshotId: null, atkiRenkDizisi: [], tahminiBoyM: "25", durum: "taslak", argeTalepKodu: null, argeTalepUrl: null, fasIlhamUrl: null, siraNo: 1, notlar: null, createdAt: t(1) },
];

function ver(path, search) {
  const id = search.get("id");
  if (path.endsWith("/tezgah")) return id ? tezgahlar.find((x) => x.id === id) : tezgahlar;
  if (path.endsWith("/cozgu")) {
    if (id) return cozguler.find((x) => x.id === id);
    const tz = search.get("tezgahId");
    return tz ? cozguler.filter((x) => x.tezgahId === tz) : cozguler;
  }
  if (path.endsWith("/numune")) {
    if (id) return numuneler.find((x) => x.id === id);
    const cz = search.get("cozguId");
    return cz ? numuneler.filter((x) => x.cozguId === cz) : numuneler;
  }
  if (path.endsWith("/iplik")) {
    const tz = search.get("tezgahId");
    return tz ? iplikler.filter((x) => x.tezgahId === tz) : iplikler;
  }
  if (path.endsWith("/orgu_snapshot")) return [];
  return [];
}

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});
const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
await page.route("**/api/**", (route) => {
  const u = new URL(route.request().url());
  route.fulfill({ contentType: "application/json", body: JSON.stringify(ver(u.pathname, u.searchParams) ?? {}) });
});

await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });

// 1) Pano: eşzamanlılık (Aktif 3/2 uyarı) + AKTİF rozet + sağ-tık menü
await page.waitForSelector(".serit");
await page.waitForTimeout(250);
await page.click(".serit > h3", { button: "right" });
await page.waitForSelector(".baglam-menu");
await page.screenshot({ path: "scripts/faz4-pano.png", fullPage: false });
await page.keyboard.press("Escape");

// 2) Tezgah detayı: kapasite + iplik havuzu
await page.click("nav.tabs >> text=Liste");
await page.click("span.kod:has-text('Stäubli-1'), .card:has-text('Stäubli-1')");
await page.waitForSelector("text=Denenebilecek İplikler");
await page.waitForTimeout(200);
await page.screenshot({ path: "scripts/faz4-tezgah.png", fullPage: true });

// 2b) Çözgü detayı: Düzenle + numune kartında iplik chip'leri
await page.click("span.kod:has-text('ÇZG-A'), .card:has-text('ÇZG-A')");
await page.waitForSelector("text=Numuneler");
await page.waitForTimeout(200);
await page.screenshot({ path: "scripts/faz4-cozgu.png", fullPage: true });
await page.click("nav.tabs >> text=Liste");
await page.click("span.kod:has-text('Stäubli-1'), .card:has-text('Stäubli-1')");
await page.waitForSelector("text=Denenebilecek İplikler");

// 3) Perde paleti + ton menüsü (gerçek basılı-tut simülasyonu)
await page.click("nav.tabs >> text=Denenebilecek İplikler");
await page.waitForSelector("text=+ İplik ekle");
await page.click("text=+ İplik ekle");
await page.click(".renk-tetik");
await page.waitForSelector(".renk-pop");
const sw = await page.locator(".renk-swatch").nth(10).boundingBox();
await page.mouse.move(sw.x + sw.width / 2, sw.y + sw.height / 2);
await page.mouse.down();
await page.waitForSelector(".ton-menu", { timeout: 2000 });
await page.waitForTimeout(150);
await page.screenshot({ path: "scripts/faz4-palet.png", fullPage: false });
await page.mouse.up();

console.log("faz4 ekran görüntüleri yazıldı");
await browser.close();
