import { chromium } from "playwright";

const now = "2026-07-07T10:00:00Z";
const t = (i) => `2026-07-07T10:0${i}:00Z`;

const tezgahlar = [
  { id: "t1", ad: "Stäubli-1", marka: "Stäubli", tip: "armur", cerceveSayisi: 20, maxTarakEniCm: "200", mekikSayisi: 6, devir: null, durum: "dolu", notlar: null, createdAt: now },
  { id: "t2", ad: "Vamatex-2", marka: "Vamatex", tip: "dobby", cerceveSayisi: 16, maxTarakEniCm: "180", mekikSayisi: 4, devir: null, durum: "bos", notlar: null, createdAt: now },
];

const cozguler = [
  { id: "c1", tezgahId: "t1", adKod: "ÇZG-A", iplik: null, tarakNo: null, cozguSikligi: null, toplamTel: 4800, cozguBoyuM: "100", taharTipi: "duz", cerceveKullanim: 8, renkDizimi: null, tezgahSira: 0, durum: "taslak", notlar: null, createdAt: t(0) },
  { id: "c2", tezgahId: "t1", adKod: "ÇZG-B", iplik: null, tarakNo: null, cozguSikligi: null, toplamTel: 3600, cozguBoyuM: "50", taharTipi: "kirik", cerceveKullanim: 6, renkDizimi: null, tezgahSira: 1, durum: "taslak", notlar: null, createdAt: t(1) },
  { id: "c3", tezgahId: "t2", adKod: "ÇZG-C", iplik: null, tarakNo: null, cozguSikligi: null, toplamTel: 4000, cozguBoyuM: "80", taharTipi: "duz", cerceveKullanim: 4, renkDizimi: null, tezgahSira: 0, durum: "taslak", notlar: null, createdAt: t(2) },
];

const N = (id, cozguId, adKod, boy, durum, siraNo) => ({
  id, cozguId, adKod, atkiIplikleri: null, atkiSikligi: null, orguSnapshotId: null,
  atkiRenkDizisi: null, tahminiBoyM: String(boy), durum, argeTalepKodu: null,
  argeTalepUrl: null, fasIlhamUrl: null, siraNo, notlar: null, createdAt: t(siraNo),
});

const numuneler = [
  // c1: 30+25+20+15 = 90 / 100 → kalan 10
  N("n1", "c1", "NUM-1 kirmizi", 30, "tamam", 0),
  N("n2", "c1", "NUM-2 mavi", 25, "dokunuyor", 1),
  N("n3", "c1", "NUM-3 yesil", 20, "onayli", 2),
  N("n4", "c1", "NUM-4 taslak", 15, "taslak", 3),
  // c2: 30+35 = 65 / 50 → AŞIM
  N("n5", "c2", "NUM-5", 30, "taslak", 0),
  N("n6", "c2", "NUM-6", 35, "onayli", 1),
  // c3
  N("n7", "c3", "NUM-7", 40, "sirada", 0),
  N("n8", "c3", "NUM-8 iptal", 20, "iptal", 1),
  N("n9", "c3", "NUM-9", 10, "taslak", 2),
];

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});
const page = await browser.newPage({ viewport: { width: 1200, height: 820 } });

await page.route("**/.netlify/functions/**", (route) => {
  const path = new URL(route.request().url()).pathname;
  const body = path.endsWith("/tezgah")
    ? tezgahlar
    : path.endsWith("/cozgu")
      ? cozguler
      : path.endsWith("/numune")
        ? numuneler
        : [];
  route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
});

await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await page.waitForSelector(".serit");
await page.waitForTimeout(300);
await page.screenshot({ path: "scripts/pano.png", fullPage: true });
console.log("pano.png yazıldı");
await browser.close();
