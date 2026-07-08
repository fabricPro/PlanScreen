import { chromium } from "playwright";

const now = "2026-07-07T10:00:00Z";
const t = (i) => `2026-07-07T10:0${i}:00Z`;

const tezgahlar = [
  { id: "t1", ad: "Stäubli-1", marka: "Stäubli", tip: "armur", cerceveSayisi: 8, maxTarakEniCm: "200", mekikSayisi: 2, devir: null, durum: "dolu", notlar: null, createdAt: now },
];

const cozguler = [
  { id: "c1", tezgahId: "t1", adKod: "ÇZG-A", iplik: null, tarakNo: null, cozguSikligi: null, toplamTel: 4800, cozguBoyuM: "100", taharTipi: "duz", cerceveKullanim: 6, renkDizimi: null, tezgahSira: 0, durum: "taslak", notlar: null, createdAt: t(0) },
];

const snapshotlar = [
  { id: "s1", kaynak: "desen-app", kaynakId: "DSN-77", kaynakVersiyon: "v2", cerceveSayisi: 8, taharTipi: "saten", weavexJson: { ad: "Saten-8" }, ad: "Saten-8 örgü", olusturmaTs: now },
  { id: "s2", kaynak: "desen-app", kaynakId: "DSN-12", kaynakVersiyon: "v1", cerceveSayisi: 4, taharTipi: "duz", weavexJson: { ad: "Bezayağı" }, ad: "Bezayağı", olusturmaTs: now },
];

const N = (id, adKod, boy, durum, siraNo, renkler, snap) => ({
  id, cozguId: "c1", adKod, atkiIplikleri: null, atkiSikligi: null,
  orguSnapshotId: snap ?? null, atkiRenkDizisi: renkler ?? null,
  tahminiBoyM: String(boy), durum, argeTalepKodu: null, argeTalepUrl: null,
  fasIlhamUrl: null, siraNo, notlar: null, createdAt: t(siraNo),
});

const numuneler = [
  // 3 farklı atkı rengi > 2 mekik  +  örgü tahar 'saten' ≠ çözgü 'duz'  → 2 uyarı
  N("n1", "NUM-1 çok renkli", 30, "onayli", 0, ["#e11d1d", "#1aa11a", "#1111ee"], "s1"),
  // uygun: tek renk, uyumlu bezayağı örgü
  N("n2", "NUM-2 uygun", 25, "taslak", 1, ["#333333"], "s2"),
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
  if (path.endsWith("/orgu_snapshot")) return id ? snapshotlar.find((x) => x.id === id) : snapshotlar;
  return [];
}

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });

await page.route("**/api/**", (route) => {
  const u = new URL(route.request().url());
  route.fulfill({
    contentType: "application/json",
    body: JSON.stringify(ver(u.pathname, u.searchParams) ?? {}),
  });
});

await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });

// 1) Pano — n1'de ⚠ görünmeli
await page.waitForSelector(".serit");
await page.waitForTimeout(300);
await page.screenshot({ path: "scripts/faz3-pano.png", fullPage: true });

// 2) Çözgü detay — numune kartlarında kısıt uyarı satırları
await page.click("span.kod:has-text('ÇZG-A')");
await page.waitForSelector("text=Numuneler");
await page.waitForTimeout(300);
await page.screenshot({ path: "scripts/faz3-cozgu.png", fullPage: true });

// 3) Örgüler ekranı — import önizlemesi + liste
await page.click("nav.tabs >> text=Örgüler");
await page.waitForSelector("text=Örgü içeri al");
await page.click("text=Örnek doldur");
await page.click("text=Doğrula / önizle");
await page.waitForSelector("text=Kaydet (içeri al)");
await page.waitForTimeout(200);
await page.screenshot({ path: "scripts/faz3-orguler.png", fullPage: true });

console.log("3 ekran görüntüsü yazıldı");
await browser.close();
