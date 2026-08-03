CREATE TYPE "public"."client_selector_type" AS ENUM('api_key', 'ip', 'all');--> statement-breakpoint
CREATE TYPE "public"."rule_algorithm" AS ENUM('token_bucket');--> statement-breakpoint
CREATE TABLE "rate_limit_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"algorithm" "rule_algorithm" DEFAULT 'token_bucket' NOT NULL,
	"capacity" integer NOT NULL,
	"refillRatePerSec" double precision NOT NULL,
	"matchMethod" varchar(16),
	"matchPathPattern" varchar(512),
	"clientSelectorType" "client_selector_type" DEFAULT 'all' NOT NULL,
	"clientSelectorValue" varchar(255),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rate_limit_rules_name_unique" UNIQUE("name")
);
