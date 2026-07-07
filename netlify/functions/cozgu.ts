import { eq } from "drizzle-orm";
import { db } from "../../src/db/client";
import { ndpCozgu } from "../../src/db/schema";
import { govde, hata, idParam, json } from "./_shared";
import type { YeniCozgu } from "../../src/db/schema";

// CRUD: ndp_cozgu (bir tezgaha bağlı)
// GET /cozgu                → tümü
// GET /cozgu?id=..          → tek
// GET /cozgu?tezgahId=..    → tezgaha ait çözgüler (tezgah_sira sırasıyla)
// POST / PUT?id / DELETE?id
export default async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const id = idParam(req);
    const tezgahId = url.searchParams.get("tezgahId");

    switch (req.method) {
      case "GET": {
        if (id) {
          const [row] = await db
            .select()
            .from(ndpCozgu)
            .where(eq(ndpCozgu.id, id));
          return row ? json(row) : hata("Çözgü bulunamadı", 404);
        }
        if (tezgahId) {
          const rows = await db
            .select()
            .from(ndpCozgu)
            .where(eq(ndpCozgu.tezgahId, tezgahId))
            .orderBy(ndpCozgu.tezgahSira, ndpCozgu.createdAt);
          return json(rows);
        }
        const rows = await db
          .select()
          .from(ndpCozgu)
          .orderBy(ndpCozgu.createdAt);
        return json(rows);
      }
      case "POST": {
        const body = await govde<YeniCozgu>(req);
        if (!body.tezgahId) return hata("'tezgahId' zorunlu");
        if (!body.adKod?.trim()) return hata("'adKod' zorunlu");
        const [row] = await db.insert(ndpCozgu).values(body).returning();
        return json(row, 201);
      }
      case "PUT": {
        if (!id) return hata("'id' zorunlu");
        const body = await govde<Partial<YeniCozgu>>(req);
        const [row] = await db
          .update(ndpCozgu)
          .set(body)
          .where(eq(ndpCozgu.id, id))
          .returning();
        return row ? json(row) : hata("Çözgü bulunamadı", 404);
      }
      case "DELETE": {
        if (!id) return hata("'id' zorunlu");
        const [row] = await db
          .delete(ndpCozgu)
          .where(eq(ndpCozgu.id, id))
          .returning();
        return row ? json({ silindi: row.id }) : hata("Çözgü bulunamadı", 404);
      }
      default:
        return hata("Desteklenmeyen method", 405);
    }
  } catch (e) {
    return hata((e as Error).message ?? "Sunucu hatası", 500);
  }
};
