import {
	boolean,
	doublePrecision,
	integer,
	pgEnum,
	pgTable,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const ruleAlgorithm = pgEnum("rule_algorithm", ["token_bucket"]);

export const clientSelectorType = pgEnum("client_selector_type", ["api_key", "ip", "all"]);

export const rateLimitRules = pgTable("rate_limit_rules", {
	id: uuid().primaryKey().defaultRandom(),
	name: varchar({ length: 255 }).notNull().unique(),
	enabled: boolean().notNull().default(true),
	priority: integer().notNull().default(0),
	algorithm: ruleAlgorithm().notNull().default("token_bucket"),
	capacity: integer().notNull(),
	refillRatePerSec: doublePrecision().notNull(),
	matchMethod: varchar({ length: 16 }),
	matchPathPattern: varchar({ length: 512 }),
	clientSelectorType: clientSelectorType().notNull().default("all"),
	clientSelectorValue: varchar({ length: 255 }),
	createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
