import { eq } from "drizzle-orm";
import { db } from "../src/db/client.js";
import { ndpGorev } from "../src/db/schema.js";
import { govde, hata, idParam, json } from "../src/server/http.js";
import type { YeniGorev } from "../src/db/schema.js";

export const config = { runtime: "edge" };

// CRUD: ndp_gorev — tezgaha ait çok seviyeli görev (to-do) ağacı
// GET /api/gorev                → tümü
// GET /api/gorev?id=..          → tek
// GET /api/gorev?tezgahId=..    → tezgahın görevleri
// POST / PUT?id / DELETE?id (alt ağaç cascade)
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
            .from(ndpGorev)
            .where(eq(ndpGorev.id, id));
          return row ? json(row) : hata("Görev bulunamadı", 404);
        }
        if (tezgahId) {
          const rows = await db
            .select()
            .from(ndpGorev)
            .where(eq(ndpGorev.tezgahId, tezgahId))
            .orderBy(ndpGorev.sira, ndpGorev.createdAt);
          return json(rows);
        }
        const rows = await db
          .select()
          .from(ndpGorev)
          .orderBy(ndpGorev.sira, ndpGorev.createdAt);
        return json(rows);
      }
      case "POST": {
        const body = await govde<YeniGorev>(req);
        // tezgah/numune bağı opsiyonel; yalnız başlık zorunlu.
        if (!body.baslik?.trim()) return hata("'baslik' zorunlu");
        const [row] = await db.insert(ndpGorev).values(body).returning();
        return json(row, 201);
      }
      case "PUT": {
        if (!id) return hata("'id' zorunlu");
        const body = await govde<Partial<YeniGorev>>(req);
        const [row] = await db
          .update(ndpGorev)
          .set(body)
          .where(eq(ndpGorev.id, id))
          .returning();
        return row ? json(row) : hata("Görev bulunamadı", 404);
      }
      case "DELETE": {
        if (!id) return hata("'id' zorunlu");
        const [row] = await db
          .delete(ndpGorev)
          .where(eq(ndpGorev.id, id))
          .returning();
        return row ? json({ silindi: row.id }) : hata("Görev bulunamadı", 404);
      }
      default:
        return hata("Desteklenmeyen method", 405);
    }
  } catch (e) {
    return hata((e as Error).message ?? "Sunucu hatası", 500);
  }
};
