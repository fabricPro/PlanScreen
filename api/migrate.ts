import { sql } from "drizzle-orm";
import { db } from "../src/db/client.js";
import { hata, json } from "../src/server/http.js";
import { IFADELER } from "../scripts/ddl.js";

export const config = { runtime: "edge" };

// Elle çalışan yedek şema uygulama ucu — normalde şema her deploy'da build
// sırasında otomatik uygulanır (scripts/db-migrate.mjs). Bu uç gerektiğinde
// (ör. deploy dışı manuel çalıştırma) aynı idempotent DDL'i (scripts/ddl.js)
// Vercel'in TAM kullandığı DATABASE_URL üzerinden uygular.
// Güvenlik: ?key= sorgu parametresi MIGRATE_KEY env'iyle eşleşmeli.

export default async (req: Request): Promise<Response> => {
  const key = new URL(req.url).searchParams.get("key");
  const beklenen = process.env.MIGRATE_KEY;
  if (!beklenen) {
    return hata("MIGRATE_KEY env tanımlı değil (Vercel'de ekleyin).", 403);
  }
  if (key !== beklenen) {
    return hata("Geçersiz key.", 403);
  }

  // Her ifadeyi ayrı çalıştır — biri patlasa da (ör. FK bloğu) diğerleri işlesin;
  // kritik ALTER … ADD COLUMN mutlaka denenmiş olur. Her zaman 200 + rapor döner.
  const rapor: { ifade: string; ok: boolean; hata?: string }[] = [];
  for (const ifade of IFADELER) {
    const ozet = ifade.slice(0, 52).replace(/\s+/g, " ").trim() + "…";
    try {
      await db.execute(sql.raw(ifade));
      rapor.push({ ifade: ozet, ok: true });
    } catch (e) {
      rapor.push({ ifade: ozet, ok: false, hata: (e as Error).message });
    }
  }
  const hepsiOk = rapor.every((r) => r.ok);
  return json({ ok: hepsiOk, rapor });
};
