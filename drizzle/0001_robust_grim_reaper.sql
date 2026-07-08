CREATE TABLE "ndp_iplik" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tezgah_id" uuid NOT NULL,
	"ad" text NOT NULL,
	"tip" text,
	"renk" text,
	"renk_adi" text,
	"numara" text,
	"notlar" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ndp_tezgah" ADD COLUMN "eszamanli_cozgu" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "ndp_iplik" ADD CONSTRAINT "ndp_iplik_tezgah_id_ndp_tezgah_id_fk" FOREIGN KEY ("tezgah_id") REFERENCES "public"."ndp_tezgah"("id") ON DELETE cascade ON UPDATE no action;