CREATE TABLE "scheduler_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"start_time" varchar(10),
	"end_time" varchar(10),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scheduler_tasks" ADD CONSTRAINT "scheduler_tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scheduler_tasks_dates_idx" ON "scheduler_tasks" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "scheduler_tasks_status_idx" ON "scheduler_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scheduler_tasks_created_by_idx" ON "scheduler_tasks" USING btree ("created_by");