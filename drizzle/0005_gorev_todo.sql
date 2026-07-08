ALTER TABLE "ndp_gorev" ALTER COLUMN "tezgah_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ndp_gorev" ADD COLUMN "numune_id" uuid;--> statement-breakpoint
ALTER TABLE "ndp_gorev" ADD COLUMN "son_tarih" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ndp_gorev" ADD COLUMN "oncelik" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "ndp_gorev" ADD CONSTRAINT "ndp_gorev_numune_id_ndp_numune_id_fk" FOREIGN KEY ("numune_id") REFERENCES "public"."ndp_numune"("id") ON DELETE set null ON UPDATE no action;