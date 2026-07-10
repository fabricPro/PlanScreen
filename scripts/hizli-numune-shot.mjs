import { chromium } from "playwright";
const now = "2026-07-08T10:00:00Z";
const tezgahlar = [{ id: "t1", ad: "PLN 6,5 SIKLIK", marka: "Stäubli", tip: "armür", cerceveSayisi: 16, maxTarakEniCm: "220", mekikSayisi: 4, esZamanliCozgu: 2, planTarihi: null, arsivlendi: false, sira: 0, devir: null, durum: "dolu", takim: "8+2 sıra tahar", aciklama: null, notlar: null, createdAt: now }];
const cozguler = [{ id: "c1", tezgahId: "t1", adKod: "ÇZG-A", iplik: null, tarakNo: null, cozguSikligi: "40/2", toplamTel: 4800, cozguBoyuM: "120", taharTipi: "duz", cerceveKullanim: 8, renkDizimi: null, tezgahSira: 0, durum: "aktif", notlar: null, createdAt: now }];
const numuneler = [{ id: "n1", cozguId: "c1", adKod: "NUM-1", atkiIplikleri: [], atkiSikligi: null, orguSnapshotId: null, atkiRenkDizisi: [], tahminiBoyM: "40", durum: "onayli", argeTalepKodu: null, argeTalepUrl: null, fasIlhamUrl: null, siraNo: 0, varyantSayisi: 0, aciklama: null, notlar: null, createdAt: now }];
function ver(p) {
  if (p.endsWith("/tezgah")) return tezgahlar;
  if (p.endsWith("/cozgu")) return cozguler;
  if (p.endsWith("/numune")) return numuneler;
  if (p.endsWith("/iplik")) return [];
  if (p.includes("/gorev")) return [];
  return [];
}
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
async function mk(w, h) {
  const page = await b.newPage({ viewport: { width: w, height: h } });
  await page.route("**/api/**", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify(ver(new URL(r.request().url()).pathname)) }));
  await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
  await page.waitForSelector(".cozgu-kart");
  return page;
}
// Masaüstü: kart görünümü (⠿ tutamaç + "+" düğmesi)
let page = await mk(1440, 900);
await page.waitForTimeout(300);
await page.screenshot({ path: "scripts/hizli-numune-kart.png", clip: { x: 20, y: 150, width: 420, height: 340 } });
// "+" tıkla → HizliForm açılır
await page.click(".cozgu-kart .mini-araclar button.primary");
await page.waitForSelector(".hizli-form", { timeout: 3000 }).catch(() => {});
await page.waitForTimeout(250);
await page.screenshot({ path: "scripts/hizli-numune-form.png", fullPage: false });
await page.close();
// Telefon: kart + "+" görünür
page = await mk(390, 844);
await page.waitForTimeout(300);
await page.screenshot({ path: "scripts/hizli-numune-tel.png", fullPage: false });
await page.close();
console.log("ok");
await b.close();
