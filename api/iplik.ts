import { eq } from "drizzle-orm";
import { db } from "../src/db/client";
import { ndpIplik } from "../src/db/schema";
import { govde, hata, idParam, json } from "../src/server/http";
import type { YeniIplik } from "../src/db/schema";

export const config = { runtime: "edge" };

// CRUD: ndp_iplik — tezgaha ait atkı ipliği havuzu
// GET /api/iplik                → tümü
// GET /api/iplik?id=..          → tek
// GET /api/iplik?tezgahId=..    → tezgahın havuzu
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
            .from(ndpIplik)
            .where(eq(ndpIplik.id, id));
          return row ? json(row) : hata("İplik bulunamadı", 404);
        }
        if (tezgahId) {
          const rows = await db
            .select()
            .from(ndpIplik)
            .where(eq(ndpIplik.tezgahId, tezgahId))
            .orderBy(ndpIplik.createdAt);
          return json(rows);
        }
        const rows = await db.select().from(ndpIplik).orderBy(ndpIplik.createdAt);
        return json(rows);
      }
      case "POST": {
        const body = await govde<YeniIplik>(req);
        if (!body.tezgahId) return hata("'tezgahId' zorunlu");
        if (!body.ad?.trim()) return hata("'ad' zorunlu");
        const [row] = await db.insert(ndpIplik).values(body).returning();
        return json(row, 201);
      }
      case "PUT": {
        if (!id) return hata("'id' zorunlu");
        const body = await govde<Partial<YeniIplik>>(req);
        const [row] = await db
          .update(ndpIplik)
          .set(body)
          .where(eq(ndpIplik.id, id))
          .returning();
        return row ? json(row) : hata("İplik bulunamadı", 404);
      }
      case "DELETE": {
        if (!id) return hata("'id' zorunlu");
        const [row] = await db
          .delete(ndpIplik)
          .where(eq(ndpIplik.id, id))
          .returning();
        return row ? json({ silindi: row.id }) : hata("İplik bulunamadı", 404);
      }
      default:
        return hata("Desteklenmeyen method", 405);
    }
  } catch (e) {
    return hata((e as Error).message ?? "Sunucu hatası", 500);
  }
};
