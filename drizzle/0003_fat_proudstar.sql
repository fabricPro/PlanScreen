ALTER TABLE "ndp_tezgah" ADD COLUMN "plan_tarihi" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ndp_tezgah" ADD COLUMN "arsivlendi" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ndp_tezgah" ADD COLUMN "sira" integer DEFAULT 0 NOT NULL;