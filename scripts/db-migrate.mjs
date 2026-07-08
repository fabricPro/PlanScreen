// Build-zamanı otomatik şema uygulama — Vercel'in build ortamı Neon'a erişebilir,
// bu yüzden her deploy'da şema kendiliğinden güncellenir (elle /api/migrate gerekmez).
// Idempotent DDL scripts/ddl.js'ten okunur (tek kaynak). DATABASE_URL yoksa veya
// bağlantı patlarsa DEPLOY'U BLOKLAMAZ — uyarı basıp 0 ile çıkar.
import { neon } from "@neondatabase/serverless";
import { IFADELER } from "./ddl.js";

const url = process.env.DATABASE_URL;
if (!url) {
  console.warn("[db-migrate] DATABASE_URL yok — şema uygulama atlandı.");
  process.exit(0);
}

// neon HTTP driver 0.10.x yalnız tagged-template kabul eder; ham DDL için
// TemplateStringsArray taklidi (raw = [stmt], değer yok).
const sql = neon(url);
function rawSql(stmt) {
  const strings = Object.assign([stmt], { raw: [stmt] });
  return sql(strings);
}

let ok = 0;
let hata = 0;
for (const ifade of IFADELER) {
  const ozet = ifade.slice(0, 52).replace(/\s+/g, " ").trim() + "…";
  try {
    await rawSql(ifade);
    ok++;
    console.log("  ✓", ozet);
  } catch (e) {
    hata++;
    console.warn("  ⚠", ozet, "→", e.message);
  }
}
console.log(`[db-migrate] tamam: ${ok} ok, ${hata} atlanan/hata.`);
// FK blokları zaten varsa hata verebilir; bu deploy'u bloklamamalı.
process.exit(0);
