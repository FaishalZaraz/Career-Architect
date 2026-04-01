ALTER TABLE "jobs" ADD COLUMN "source" text DEFAULT 'Direct';--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "interview_type" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "interview_link" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "deadline" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;