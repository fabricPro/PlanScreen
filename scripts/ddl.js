// Idempotent şema DDL'i — TEK kaynak.
// Hem build-zamanı otomatik migrate (scripts/db-migrate.mjs) hem de
// elle çalışan uç (api/migrate.ts) buradan okur. Yeni kolon/tablo eklerken
// yalnız burayı güncelle → deploy'da otomatik uygulanır.
export const IFADELER = [
  `CREATE TABLE IF NOT EXISTS "ndp_tezgah" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "ad" text NOT NULL, "marka" text, "tip" text,
    "cerceve_sayisi" integer DEFAULT 0 NOT NULL,
    "max_tarak_eni_cm" numeric,
    "mekik_sayisi" integer DEFAULT 1 NOT NULL,
    "eszamanli_cozgu" integer DEFAULT 2 NOT NULL,
    "devir" integer, "durum" text DEFAULT 'bos' NOT NULL,
    "takim" text, "aciklama" text, "notlar" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL)`,
  `ALTER TABLE "ndp_tezgah" ADD COLUMN IF NOT EXISTS "eszamanli_cozgu" integer DEFAULT 2 NOT NULL`,
  `ALTER TABLE "ndp_tezgah" ADD COLUMN IF NOT EXISTS "plan_tarihi" timestamp with time zone`,
  `ALTER TABLE "ndp_tezgah" ADD COLUMN IF NOT EXISTS "arsivlendi" boolean DEFAULT false NOT NULL`,
  `ALTER TABLE "ndp_tezgah" ADD COLUMN IF NOT EXISTS "sira" integer DEFAULT 0 NOT NULL`,
  `ALTER TABLE "ndp_tezgah" ADD COLUMN IF NOT EXISTS "takim" text`,
  `ALTER TABLE "ndp_tezgah" ADD COLUMN IF NOT EXISTS "aciklama" text`,
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
    "sira_no" integer DEFAULT 0 NOT NULL,
    "varyant_sayisi" integer DEFAULT 0 NOT NULL, "aciklama" text, "notlar" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL)`,
  `ALTER TABLE "ndp_numune" ADD COLUMN IF NOT EXISTS "varyant_sayisi" integer DEFAULT 0 NOT NULL`,
  `ALTER TABLE "ndp_numune" ADD COLUMN IF NOT EXISTS "aciklama" text`,
  `CREATE TABLE IF NOT EXISTS "ndp_iplik" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "tezgah_id" uuid NOT NULL, "ad" text NOT NULL, "tip" text, "renk" text,
    "renk_adi" text, "numara" text, "notlar" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "ndp_gorev" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "tezgah_id" uuid, "cozgu_id" uuid, "numune_id" uuid, "parent_id" uuid, "baslik" text NOT NULL,
    "tamamlandi" boolean DEFAULT false NOT NULL,
    "son_tarih" timestamp with time zone,
    "oncelik" integer DEFAULT 1 NOT NULL, "sira" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL)`,
  `ALTER TABLE "ndp_gorev" ALTER COLUMN "tezgah_id" DROP NOT NULL`,
  `ALTER TABLE "ndp_gorev" ADD COLUMN IF NOT EXISTS "cozgu_id" uuid`,
  `ALTER TABLE "ndp_gorev" ADD COLUMN IF NOT EXISTS "numune_id" uuid`,
  `ALTER TABLE "ndp_gorev" ADD COLUMN IF NOT EXISTS "son_tarih" timestamp with time zone`,
  `ALTER TABLE "ndp_gorev" ADD COLUMN IF NOT EXISTS "oncelik" integer DEFAULT 1 NOT NULL`,
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
  `DO $$ BEGIN
    ALTER TABLE "ndp_gorev" ADD CONSTRAINT "ndp_gorev_tezgah_id_ndp_tezgah_id_fk"
      FOREIGN KEY ("tezgah_id") REFERENCES "public"."ndp_tezgah"("id") ON DELETE cascade;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
    ALTER TABLE "ndp_gorev" ADD CONSTRAINT "ndp_gorev_parent_id_ndp_gorev_id_fk"
      FOREIGN KEY ("parent_id") REFERENCES "public"."ndp_gorev"("id") ON DELETE cascade;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
    ALTER TABLE "ndp_gorev" ADD CONSTRAINT "ndp_gorev_numune_id_ndp_numune_id_fk"
      FOREIGN KEY ("numune_id") REFERENCES "public"."ndp_numune"("id") ON DELETE set null;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
    ALTER TABLE "ndp_gorev" ADD CONSTRAINT "ndp_gorev_cozgu_id_ndp_cozgu_id_fk"
      FOREIGN KEY ("cozgu_id") REFERENCES "public"."ndp_cozgu"("id") ON DELETE set null;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
];
