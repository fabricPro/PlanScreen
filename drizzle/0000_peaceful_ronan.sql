CREATE TABLE "ndp_cozgu" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tezgah_id" uuid NOT NULL,
	"ad_kod" text NOT NULL,
	"iplik" text,
	"tarak_no" text,
	"cozgu_sikligi" numeric,
	"toplam_tel" integer,
	"cozgu_boyu_m" numeric,
	"tahar_tipi" text,
	"cerceve_kullanim" integer,
	"renk_dizimi" jsonb,
	"tezgah_sira" integer DEFAULT 0 NOT NULL,
	"durum" text DEFAULT 'taslak' NOT NULL,
	"notlar" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ndp_numune" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cozgu_id" uuid NOT NULL,
	"ad_kod" text NOT NULL,
	"atki_iplikleri" jsonb,
	"atki_sikligi" numeric,
	"orgu_snapshot_id" uuid,
	"atki_renk_dizisi" jsonb,
	"tahmini_boy_m" numeric,
	"durum" text DEFAULT 'taslak' NOT NULL,
	"arge_talep_kodu" text,
	"arge_talep_url" text,
	"fas_ilham_url" text,
	"sira_no" integer DEFAULT 0 NOT NULL,
	"notlar" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ndp_orgu_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kaynak" text,
	"kaynak_id" text,
	"kaynak_versiyon" text,
	"cerceve_sayisi" integer,
	"tahar_tipi" text,
	"weavex_json" jsonb,
	"ad" text,
	"olusturma_ts" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ndp_tezgah" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad" text NOT NULL,
	"marka" text,
	"tip" text,
	"cerceve_sayisi" integer DEFAULT 0 NOT NULL,
	"max_tarak_eni_cm" numeric,
	"mekik_sayisi" integer DEFAULT 1 NOT NULL,
	"devir" integer,
	"durum" text DEFAULT 'bos' NOT NULL,
	"notlar" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ndp_cozgu" ADD CONSTRAINT "ndp_cozgu_tezgah_id_ndp_tezgah_id_fk" FOREIGN KEY ("tezgah_id") REFERENCES "public"."ndp_tezgah"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ndp_numune" ADD CONSTRAINT "ndp_numune_cozgu_id_ndp_cozgu_id_fk" FOREIGN KEY ("cozgu_id") REFERENCES "public"."ndp_cozgu"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ndp_numune" ADD CONSTRAINT "ndp_numune_orgu_snapshot_id_ndp_orgu_snapshot_id_fk" FOREIGN KEY ("orgu_snapshot_id") REFERENCES "public"."ndp_orgu_snapshot"("id") ON DELETE set null ON UPDATE no action;