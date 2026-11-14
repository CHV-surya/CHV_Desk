CREATE TABLE "bda_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"company_name" varchar(255),
	"phone_number" varchar(50) NOT NULL,
	"email" varchar(255),
	"location" varchar(255),
	"project_id" uuid,
	"required_software" text NOT NULL,
	"requirements" text,
	"lead_source" varchar(100),
	"enquiry_date" date NOT NULL,
	"follow_up_status" varchar(50) DEFAULT 'New' NOT NULL,
	"remarks" text,
	"next_follow_up_date" date,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bda_customers" ADD CONSTRAINT "bda_customers_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bda_customers" ADD CONSTRAINT "bda_customers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bda_customers" ADD CONSTRAINT "bda_customers_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bda_customers_customer_name_idx" ON "bda_customers" USING btree ("customer_name");--> statement-breakpoint
CREATE INDEX "bda_customers_company_name_idx" ON "bda_customers" USING btree ("company_name");--> statement-breakpoint
CREATE INDEX "bda_customers_phone_number_idx" ON "bda_customers" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "bda_customers_project_id_idx" ON "bda_customers" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "bda_customers_status_idx" ON "bda_customers" USING btree ("follow_up_status");--> statement-breakpoint
CREATE INDEX "bda_customers_enquiry_date_idx" ON "bda_customers" USING btree ("enquiry_date");--> statement-breakpoint
CREATE INDEX "bda_customers_created_by_idx" ON "bda_customers" USING btree ("created_by");