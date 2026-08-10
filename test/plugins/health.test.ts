import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { FastifyInstance } from "fastify";

import { build } from "../helper.ts";

let app: FastifyInstance;

before(async () => {
	app = await build();
});
after(async () => {
	await app.close();
});

test("livez always reports UP", async () => {
	const res = await app.inject({ method: "GET", url: "/livez" });

	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.json(), { status: "UP" });
});

test("readyz reports UP when db, redis and rule cache respond", async () => {
	const res = await app.inject({ method: "GET", url: "/readyz" });
	const body = res.json() as {
		status: "UP" | "DOWN";
		cache: { ready: boolean; ruleCount: number };
	};

	assert.equal(res.statusCode, 200);
	assert.equal(body.status, "UP");
	assert.equal(body.cache.ready, true);
	assert.ok(body.cache.ruleCount >= 0);
});

test("healthz reports component statuses", async () => {
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
	assert.equal(body.status, "UP");
	assert.equal(body.components.database.status, "UP");
	assert.equal(body.components.redis.status, "UP");
	assert.equal(body.components.cache.status, "UP");
	assert.ok(body.components.cache.ruleCount >= 0);
});

test("unknown route returns 404", async () => {
	const res = await app.inject({ method: "GET", url: "/does-not-exist" });

	assert.equal(res.statusCode, 404);
	assert.deepEqual(res.json(), { message: "Not found" });
});
