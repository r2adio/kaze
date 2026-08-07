import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
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

async function healthPlugin(fastify: FastifyInstance) {
	fastify.get("/livez", async () => ({ status: "UP" as const }));

	fastify.get("/readyz", async (_req, reply) => {
		const [db, redis] = await Promise.allSettled([checkDb(), checkRedis(fastify)]);
		const ready = db.status === "fulfilled" && redis.status === "fulfilled";
		reply.code(ready ? 200 : 503);
		return { status: ready ? "UP" : "DOWN" };
	});

	fastify.get("/healthz", async () => {
		const [db, redis] = await Promise.allSettled([checkDb(), checkRedis(fastify)]);
		return {
			status: db.status === "fulfilled" && redis.status === "fulfilled" ? "UP" : "DOWN",
			components: {
				database: {
					status: db.status === "fulfilled" ? "UP" : "DOWN",
					...("value" in db && db.value ? { latencyMs: db.value } : {}),
				},
				redis: {
					status: redis.status === "fulfilled" ? "UP" : "DOWN",
					...("value" in redis && redis.value ? { latencyMs: redis.value } : {}),
				},
			},
		};
	});
}

export default fp(healthPlugin);
