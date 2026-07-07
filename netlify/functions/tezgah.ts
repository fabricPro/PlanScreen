import { eq } from "drizzle-orm";
import { db } from "../../src/db/client";
import { ndpTezgah } from "../../src/db/schema";
import { govde, hata, idParam, json } from "./_shared";
import type { YeniTezgah } from "../../src/db/schema";

// CRUD: ndp_tezgah
// GET /tezgah            → tümü
// GET /tezgah?id=..      → tek
// POST /tezgah           → oluştur
// PUT /tezgah?id=..      → güncelle
// DELETE /tezgah?id=..   → sil
export default async (req: Request): Promise<Response> => {
  try {
    const id = idParam(req);

    switch (req.method) {
      case "GET": {
        if (id) {
          const [row] = await db
            .select()
            .from(ndpTezgah)
            .where(eq(ndpTezgah.id, id));
          return row ? json(row) : hata("Tezgah bulunamadı", 404);
        }
        const rows = await db
          .select()
          .from(ndpTezgah)
          .orderBy(ndpTezgah.createdAt);
        return json(rows);
      }
      case "POST": {
        const body = await govde<YeniTezgah>(req);
        if (!body.ad?.trim()) return hata("'ad' zorunlu");
        const [row] = await db.insert(ndpTezgah).values(body).returning();
        return json(row, 201);
      }
      case "PUT": {
        if (!id) return hata("'id' zorunlu");
        const body = await govde<Partial<YeniTezgah>>(req);
        const [row] = await db
          .update(ndpTezgah)
          .set(body)
          .where(eq(ndpTezgah.id, id))
          .returning();
        return row ? json(row) : hata("Tezgah bulunamadı", 404);
      }
      case "DELETE": {
        if (!id) return hata("'id' zorunlu");
        const [row] = await db
          .delete(ndpTezgah)
          .where(eq(ndpTezgah.id, id))
          .returning();
        return row ? json({ silindi: row.id }) : hata("Tezgah bulunamadı", 404);
      }
      default:
        return hata("Desteklenmeyen method", 405);
    }
  } catch (e) {
    return hata((e as Error).message ?? "Sunucu hatası", 500);
  }
};
