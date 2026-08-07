import { eq } from "drizzle-orm";
import { db } from "../../db/index.ts";
import { rateLimitRules } from "../../db/schema.ts";
import type { RateLimitRule } from "../../domain/rate-limit/entities.ts";

export async function listEnabledRules(): Promise<RateLimitRule[]> {
	const rows = await db.select().from(rateLimitRules).where(eq(rateLimitRules.enabled, true));
	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		enabled: row.enabled,
		priority: row.priority,
		algorithm: row.algorithm,
		capacity: row.capacity,
		refillRatePerSec: row.refillRatePerSec,
		matchMethod: row.matchMethod,
		matchPathPattern: row.matchPathPattern,
		clientSelectorType: row.clientSelectorType,
		clientSelectorValue: row.clientSelectorValue,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	}));
}
