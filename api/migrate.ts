import { sql } from "drizzle-orm";
import { db } from "../src/db/client.js";
import { hata, json } from "../src/server/http.js";

export const config = { runtime: "edge" };

// Tek seferlik şema uygulama ucu — Vercel'in TAM kullandığı DATABASE_URL üzerinden
// çalışır, böylece Neon branch karışıklığını aşar. Idempotent (IF NOT EXISTS).
// Güvenlik: ?key= sorgu parametresi MIGRATE_KEY env'iyle eşleşmeli.
// İş bitince MIGRATE_KEY'i silebilirsiniz (endpoint zararsızdır ama kapanır).

const IFADELER: string[] = [
  `CREATE TABLE IF NOT EXISTS "ndp_tezgah" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "ad" text NOT NULL, "marka" text, "tip" text,
    "cerceve_sayisi" integer DEFAULT 0 NOT NULL,
    "max_tarak_eni_cm" numeric,
    "mekik_sayisi" integer DEFAULT 1 NOT NULL,
    "eszamanli_cozgu" integer DEFAULT 2 NOT NULL,
    "devir" integer, "durum" text DEFAULT 'bos' NOT NULL, "notlar" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL)`,
  `ALTER TABLE "ndp_tezgah" ADD COLUMN IF NOT EXISTS "eszamanli_cozgu" integer DEFAULT 2 NOT NULL`,
  `CREATE TABLE IF NOT EXISTS "ndp_orgu_snapshot" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "kaynak" text, "kaynak_id" text, "kaynak_versiyon" text,
    "cerceve_sayisi" integer, "tahar_tipi" text, "weavex_json" jsonb, "ad" text,
    "olusturma_ts" timestamp with time zone DEFAULT now() NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "ndp_cozgu" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "tezgah_id" uuid NOT NULL, "ad_kod" text NOT NULL, "iplik" text, "tarak_no" text,
    "cozgu_sikligi" numeric, "toplam_tel" integer, "cozgu_boyu_m" numeric,
    "tahar_tipi" text, "cerceve_kullanim" integer, "renk_dizimi" jsonb,
    "tezgah_sira" integer DEFAULT 0 NOT NULL, "durum" text DEFAULT 'taslak' NOT NULL,
    "notlar" text, "created_at" timestamp with time zone DEFAULT now() NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "ndp_numune" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "cozgu_id" uuid NOT NULL, "ad_kod" text NOT NULL, "atki_iplikleri" jsonb,
    "atki_sikligi" numeric, "orgu_snapshot_id" uuid, "atki_renk_dizisi" jsonb,
    "tahmini_boy_m" numeric, "durum" text DEFAULT 'taslak' NOT NULL,
    "arge_talep_kodu" text, "arge_talep_url" text, "fas_ilham_url" text,
    "sira_no" integer DEFAULT 0 NOT NULL, "notlar" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "ndp_iplik" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "tezgah_id" uuid NOT NULL, "ad" text NOT NULL, "tip" text, "renk" text,
    "renk_adi" text, "numara" text, "notlar" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL)`,
  `DO $$ BEGIN
    ALTER TABLE "ndp_cozgu" ADD CONSTRAINT "ndp_cozgu_tezgah_id_ndp_tezgah_id_fk"
      FOREIGN KEY ("tezgah_id") REFERENCES "public"."ndp_tezgah"("id") ON DELETE cascade;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
    ALTER TABLE "ndp_numune" ADD CONSTRAINT "ndp_numune_cozgu_id_ndp_cozgu_id_fk"
      FOREIGN KEY ("cozgu_id") REFERENCES "public"."ndp_cozgu"("id") ON DELETE cascade;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
    ALTER TABLE "ndp_numune" ADD CONSTRAINT "ndp_numune_orgu_snapshot_id_ndp_orgu_snapshot_id_fk"
      FOREIGN KEY ("orgu_snapshot_id") REFERENCES "public"."ndp_orgu_snapshot"("id") ON DELETE set null;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
    ALTER TABLE "ndp_iplik" ADD CONSTRAINT "ndp_iplik_tezgah_id_ndp_tezgah_id_fk"
      FOREIGN KEY ("tezgah_id") REFERENCES "public"."ndp_tezgah"("id") ON DELETE cascade;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
];

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
