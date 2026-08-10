import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import type { RuleCacheStatus } from "../../application/rule-cache.ts";
import { pool } from "../../db/index.ts";

async function checkDb(): Promise<number> {
	const start = performance.now();
	await pool.query("SELECT 1");
	return Math.round(performance.now() - start);
}

async function checkRedis(fastify: FastifyInstance): Promise<number> {
	const start = performance.now();
	await fastify.redis.ping();
	return Math.round(performance.now() - start);
}

function cacheStatus(fastify: FastifyInstance): RuleCacheStatus | null {
	if (!fastify.hasDecorator("ruleCache")) return null;
	return fastify.ruleCache.status();
}

async function healthPlugin(fastify: FastifyInstance) {
	fastify.get("/livez", async () => ({ status: "UP" as const }));

	fastify.get("/readyz", async (_req, reply) => {
		const [db, redis] = await Promise.allSettled([checkDb(), checkRedis(fastify)]);
		const cache = cacheStatus(fastify);
		const ready =
			db.status === "fulfilled" && redis.status === "fulfilled" && (cache?.ready ?? false);
		reply.code(ready ? 200 : 503);
		return { status: ready ? "UP" : "DOWN", cache };
	});

	fastify.get("/healthz", async () => {
		const [db, redis] = await Promise.allSettled([checkDb(), checkRedis(fastify)]);
		const cache = cacheStatus(fastify);
		const dbUp = db.status === "fulfilled";
		const redisUp = redis.status === "fulfilled";
		const cacheUp = cache?.ready ?? false;
		return {
			status: dbUp && redisUp && cacheUp ? "UP" : "DOWN",
			components: {
				database: {
					status: dbUp ? "UP" : "DOWN",
					...("value" in db && db.value ? { latencyMs: db.value } : {}),
				},
				redis: {
					status: redisUp ? "UP" : "DOWN",
					...("value" in redis && redis.value ? { latencyMs: redis.value } : {}),
				},
				cache: {
					status: cacheUp ? "UP" : "DOWN",
					...(cache
						? {
								ruleCount: cache.ruleCount,
								lastRefreshAt: cache.lastRefreshAt,
								...(cache.lastError ? { error: cache.lastError } : {}),
							}
						: {}),
				},
			},
		};
	});
}

export default fp(healthPlugin);
