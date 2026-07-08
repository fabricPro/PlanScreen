CREATE TABLE "ndp_gorev" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tezgah_id" uuid NOT NULL,
	"parent_id" uuid,
	"baslik" text NOT NULL,
	"tamamlandi" boolean DEFAULT false NOT NULL,
	"sira" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ndp_gorev" ADD CONSTRAINT "ndp_gorev_tezgah_id_ndp_tezgah_id_fk" FOREIGN KEY ("tezgah_id") REFERENCES "public"."ndp_tezgah"("id") ON DELETE cascade ON UPDATE no action;