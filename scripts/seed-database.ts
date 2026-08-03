import type { InferInsertModel } from "drizzle-orm";
import { db, pool } from "../src/db/index.ts";
import { rateLimitRules } from "../src/db/schema.ts";

const rules: InferInsertModel<typeof rateLimitRules>[] = [
	{
		name: "api-demo",
		enabled: true,
		priority: 0,
		algorithm: "token_bucket",
		capacity: 10,
		refillRatePerSec: 1,
		matchMethod: null,
		matchPathPattern: "/api/*",
		clientSelectorType: "all",
		clientSelectorValue: null,
	},
	{
		name: "login",
		enabled: true,
		priority: 0,
		algorithm: "token_bucket",
		capacity: 5,
		refillRatePerSec: 1,
		matchMethod: "POST",
		matchPathPattern: "/login",
		clientSelectorType: "all",
		clientSelectorValue: null,
	},
	{
		name: "admin-ip",
		enabled: true,
		priority: 0,
		algorithm: "token_bucket",
		capacity: 100,
		refillRatePerSec: 10,
		matchMethod: null,
		matchPathPattern: "/admin/*",
		clientSelectorType: "ip",
		clientSelectorValue: "127.0.0.1",
	},
];

await db.insert(rateLimitRules).values(rules).onConflictDoNothing();
console.log(`seeded ${rules.length} rules`);

await pool.end();
