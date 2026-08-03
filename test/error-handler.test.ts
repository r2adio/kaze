import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { FastifyInstance } from "fastify";

import { build } from "./helper.ts";

let app: FastifyInstance;

before(async () => {
	app = await build((app) => {
		app.get("/client-error", async () => {
			const err = new Error("bad request");
			Object.assign(err, { statusCode: 400 });
			throw err;
		});
		app.get("/server-error", async () => {
			throw new Error("kaboom");
		});
	});
});

after(async () => {
	await app.close();
});

test("4xx errors surface their message", async () => {
	const res = await app.inject({ method: "GET", url: "/client-error" });

	assert.equal(res.statusCode, 400);
	assert.deepEqual(res.json(), { message: "bad request" });
});

test("5xx errors return Internal Server Error", async () => {
	const res = await app.inject({ method: "GET", url: "/server-error" });

	assert.equal(res.statusCode, 500);
	assert.deepEqual(res.json(), { message: "Internal Server Error" });
});

test("404 handler rate-limits missing routes", async () => {
	for (let i = 0; i < 3; i++) {
		const res = await app.inject({ method: "GET", url: "/rate-limited-404" });
		assert.equal(res.statusCode, 404);
	}

	const res = await app.inject({ method: "GET", url: "/rate-limited-404" });

	assert.equal(res.statusCode, 429);
	const body = res.json() as { message: string };
	assert.match(body.message, /^Rate limit exceeded/);
});
