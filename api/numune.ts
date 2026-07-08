import { eq } from "drizzle-orm";
import { db } from "../src/db/client";
import { ndpNumune } from "../src/db/schema";
import { govde, hata, idParam, json } from "../src/server/http";
import type { YeniNumune } from "../src/db/schema";

export const config = { runtime: "edge" };

// CRUD: ndp_numune (bir çözgüye bağlı = 1 kumaş)
// GET /api/numune                → tümü
// GET /api/numune?id=..          → tek
// GET /api/numune?cozguId=..     → çözgüye ait numuneler (sira_no sırasıyla)
// POST / PUT?id / DELETE?id
export default async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const id = idParam(req);
    const cozguId = url.searchParams.get("cozguId");

    switch (req.method) {
      case "GET": {
        if (id) {
          const [row] = await db
            .select()
            .from(ndpNumune)
            .where(eq(ndpNumune.id, id));
          return row ? json(row) : hata("Numune bulunamadı", 404);
        }
        if (cozguId) {
          const rows = await db
            .select()
            .from(ndpNumune)
            .where(eq(ndpNumune.cozguId, cozguId))
            .orderBy(ndpNumune.siraNo, ndpNumune.createdAt);
          return json(rows);
        }
        const rows = await db
          .select()
          .from(ndpNumune)
          .orderBy(ndpNumune.createdAt);
        return json(rows);
      }
      case "POST": {
        const body = await govde<YeniNumune>(req);
        if (!body.cozguId) return hata("'cozguId' zorunlu");
        if (!body.adKod?.trim()) return hata("'adKod' zorunlu");
        const [row] = await db.insert(ndpNumune).values(body).returning();
        return json(row, 201);
      }
      case "PUT": {
        if (!id) return hata("'id' zorunlu");
        const body = await govde<Partial<YeniNumune>>(req);
        const [row] = await db
          .update(ndpNumune)
          .set(body)
          .where(eq(ndpNumune.id, id))
          .returning();
        return row ? json(row) : hata("Numune bulunamadı", 404);
      }
      case "DELETE": {
        if (!id) return hata("'id' zorunlu");
        const [row] = await db
          .delete(ndpNumune)
          .where(eq(ndpNumune.id, id))
          .returning();
        return row ? json({ silindi: row.id }) : hata("Numune bulunamadı", 404);
      }
      default:
        return hata("Desteklenmeyen method", 405);
    }
  } catch (e) {
    return hata((e as Error).message ?? "Sunucu hatası", 500);
  }
};
