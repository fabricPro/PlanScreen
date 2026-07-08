import { chromium } from "playwright";

const now = "2026-07-08T10:00:00Z";
const tezgahlar = [
  { id: "t1", ad: "Stäubli-1", marka: "Stäubli", tip: "armur", cerceveSayisi: 8, maxTarakEniCm: "200", mekikSayisi: 2, esZamanliCozgu: 2, devir: null, durum: "dolu", notlar: null, createdAt: now },
  { id: "t2", ad: "Vamatex-2", marka: "Vamatex", tip: "dobby", cerceveSayisi: 16, maxTarakEniCm: "180", mekikSayisi: 4, esZamanliCozgu: 2, devir: null, durum: "bos", notlar: null, createdAt: now },
];
const G = (id, tezgahId, parentId, baslik, tamamlandi, sira) => ({
  id, tezgahId, parentId, baslik, tamamlandi, sira, createdAt: `2026-07-08T10:0${sira}:00Z`,
});
const gorevler = [
  G("g1", "t1", null, "Çözgü hazırlığı", false, 0),
  G("g1a", "t1", "g1", "Tahar kontrolü", true, 0),
  G("g1b", "t1", "g1", "Çerçeve bağlama", false, 1),
  G("g1b1", "t1", "g1b", "Vida sıkma", false, 0),
  G("g2", "t1", null, "Numune dokuma", false, 1),
  G("g3", "t2", null, "Bakım", true, 0),
  G("g3a", "t2", "g3", "Yağlama", true, 0),
];

function ver(path, search) {
  const tz = search.get("tezgahId");
  if (path.endsWith("/tezgah")) return tezgahlar;
  if (path.endsWith("/gorev")) return tz ? gorevler.filter((g) => g.tezgahId === tz) : gorevler;
  if (path.endsWith("/cozgu")) return [];
  if (path.endsWith("/numune")) return [];
  if (path.endsWith("/iplik")) return [];
  if (path.endsWith("/orgu_snapshot")) return [];
  return [];
}

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});
const page = await browser.newPage({ viewport: { width: 1180, height: 820 } });
await page.route("**/api/**", (route) => {
  const u = new URL(route.request().url());
  route.fulfill({ contentType: "application/json", body: JSON.stringify(ver(u.pathname, u.searchParams) ?? []) });
});

await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await page.click("nav.tabs >> text=Görevler");
await page.waitForSelector(".gorev-satir");
await page.waitForTimeout(300);
await page.screenshot({ path: "scripts/gorev-pano.png", fullPage: true });
console.log("gorev-pano.png yazıldı");
await browser.close();
