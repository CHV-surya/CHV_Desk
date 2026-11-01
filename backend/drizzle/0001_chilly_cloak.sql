CREATE TABLE "digital_marketing_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"monthly_record_id" uuid NOT NULL,
	"content_type" varchar(20) NOT NULL,
	"content_name" text NOT NULL,
	"video_shoot" boolean,
	"editing" boolean,
	"client_confirmation" boolean,
	"scheduled" boolean,
	"scheduled_date" date,
	"ad_campaign_report_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "digital_marketing_months" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"video_target" integer DEFAULT 0 NOT NULL,
	"poster_target" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "digital_marketing_entries" ADD CONSTRAINT "digital_marketing_entries_monthly_record_id_digital_marketing_months_id_fk" FOREIGN KEY ("monthly_record_id") REFERENCES "public"."digital_marketing_months"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_marketing_months" ADD CONSTRAINT "digital_marketing_months_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_marketing_months" ADD CONSTRAINT "digital_marketing_months_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dm_entries_monthly_record_idx" ON "digital_marketing_entries" USING btree ("monthly_record_id");--> statement-breakpoint
CREATE INDEX "dm_entries_content_type_idx" ON "digital_marketing_entries" USING btree ("monthly_record_id","content_type");--> statement-breakpoint
CREATE UNIQUE INDEX "dm_project_month_year_unique_idx" ON "digital_marketing_months" USING btree ("project_id","month","year");