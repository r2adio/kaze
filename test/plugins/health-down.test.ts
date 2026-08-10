// Exercises the degraded paths of the health plugin without a running
// Postgres or Redis: point DATABASE_URL at an unreachable port and build
// an app with only the health plugin (no redis plugin), so both checks
// fail and the handlers report DOWN.

import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { FastifyInstance } from "fastify";
import Fastify from "fastify";

process.env.DATABASE_URL = "postgresql://127.0.0.1:1/kaze";

const { default: healthPlugin } = await import("../../src/plugins/app/health.ts");
const { pool } = await import("../../src/db/index.ts");
// pg re-emits failed-connection errors on the pool; absorb them so an
// unreachable database can't crash the test process.
pool.on("error", () => {});

let app: FastifyInstance;

before(async () => {
	app = Fastify({ logger: false });
	app.register(healthPlugin);
	await app.ready();
});

after(async () => {
	await app.close();
});

test("readyz returns 503 DOWN when dependencies are unreachable", async () => {
	const res = await app.inject({ method: "GET", url: "/readyz" });
	const body = res.json() as { status: "UP" | "DOWN"; cache: unknown };

	assert.equal(res.statusCode, 503);
	assert.equal(body.status, "DOWN");
	assert.equal(body.cache, null);
});

test("healthz reports DOWN components when dependencies are unreachable", async () => {
	const res = await app.inject({ method: "GET", url: "/healthz" });
	const body = res.json() as {
		status: "UP" | "DOWN";
		components: {
			database: { status: "UP" | "DOWN"; latencyMs?: number };
			redis: { status: "UP" | "DOWN"; latencyMs?: number };
			cache: { status: "UP" | "DOWN"; ruleCount: number };
		};
	};

	assert.equal(res.statusCode, 200);
	assert.equal(body.status, "DOWN");
	assert.equal(body.components.database.status, "DOWN");
	assert.equal(body.components.redis.status, "DOWN");
	assert.equal(body.components.cache.status, "DOWN");
	assert.equal("latencyMs" in body.components.database, false);
	assert.equal("latencyMs" in body.components.redis, false);
});
