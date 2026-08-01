import assert from "node:assert/strict";
import { test } from "node:test";

import { build } from "../helper.ts";

test("livez always reports UP", async (t) => {
	const app = await build(t);

	const res = await app.inject({ method: "GET", url: "/livez" });

	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.json(), { status: "UP" });
});

test("readyz reports UP when db and redis respond", async (t) => {
	const app = await build(t);

	const res = await app.inject({ method: "GET", url: "/readyz" });

	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.json(), { status: "UP" });
});

test("healthz reports component statuses", async (t) => {
	const app = await build(t);

	const res = await app.inject({ method: "GET", url: "/healthz" });
	const body = res.json() as {
		status: "UP" | "DOWN";
		components: {
			database: { status: "UP" | "DOWN"; latencyMs?: number };
			redis: { status: "UP" | "DOWN"; latencyMs?: number };
		};
	};

	assert.equal(res.statusCode, 200);
	assert.equal(body.status, "UP");
	assert.equal(body.components.database.status, "UP");
	assert.ok(typeof body.components.database.latencyMs === "number");
	assert.equal(body.components.redis.status, "UP");
	assert.ok(typeof body.components.redis.latencyMs === "number");
});

test("unknown route returns 404", async (t) => {
	const app = await build(t);

	const res = await app.inject({ method: "GET", url: "/does-not-exist" });

	assert.equal(res.statusCode, 404);
	assert.deepEqual(res.json(), { message: "Not found" });
});
