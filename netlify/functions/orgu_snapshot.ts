import { eq } from "drizzle-orm";
import { db } from "../../src/db/client";
import { ndpOrguSnapshot } from "../../src/db/schema";
import { govde, hata, idParam, json } from "./_shared";

// ndp_orgu_snapshot — desen uygulamasından import edilen KOPYA (Altın Kural §3).
// Immutable: GET + POST + DELETE var, PUT YOK (kayıt düzenlenmez, yeni versiyon = yeni kayıt).
// POST gövdesi zaten doğrulanmış (frontend parseWeaveX ile) kolon alanlarını taşır.

type YeniSnapshot = typeof ndpOrguSnapshot.$inferInsert;

export default async (req: Request): Promise<Response> => {
  try {
    const id = idParam(req);

    switch (req.method) {
      case "GET": {
        if (id) {
          const [row] = await db
            .select()
            .from(ndpOrguSnapshot)
            .where(eq(ndpOrguSnapshot.id, id));
          return row ? json(row) : hata("Örgü snapshot bulunamadı", 404);
        }
        const rows = await db
          .select()
          .from(ndpOrguSnapshot)
          .orderBy(ndpOrguSnapshot.olusturmaTs);
        return json(rows);
      }
      case "POST": {
        const body = await govde<YeniSnapshot>(req);
        if (!body.ad || !body.taharTipi || !body.cerceveSayisi) {
          return hata("ad, tahar_tipi ve cerceve_sayisi zorunlu");
        }
        const [row] = await db
          .insert(ndpOrguSnapshot)
          .values(body)
          .returning();
        return json(row, 201);
      }
      case "DELETE": {
        if (!id) return hata("'id' zorunlu");
        const [row] = await db
          .delete(ndpOrguSnapshot)
          .where(eq(ndpOrguSnapshot.id, id))
          .returning();
        return row
          ? json({ silindi: row.id })
          : hata("Örgü snapshot bulunamadı", 404);
      }
      default:
        return hata("Desteklenmeyen method (snapshot immutable — PUT yok)", 405);
    }
  } catch (e) {
    return hata((e as Error).message ?? "Sunucu hatası", 500);
  }
};
