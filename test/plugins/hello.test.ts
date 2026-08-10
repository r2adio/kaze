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

test("demo route /api/hello responds", async () => {
	const res = await app.inject({ method: "GET", url: "/api/hello" });

	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.json(), { message: "hello" });
});
