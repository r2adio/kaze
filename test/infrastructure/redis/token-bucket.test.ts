import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import type { FastifyInstance } from "fastify";

import { consumeToken } from "../../../src/infrastructure/redis/token-bucket.ts";
import { build } from "../../helper.ts";

let app: FastifyInstance;

before(async () => {
	app = await build();
});

after(async () => {
	await app.close();
});

test("consumes tokens until empty then denies", async () => {
	const key = `kaze-test:${randomUUID()}`;
	await app.redis.del(key);

	const first = await consumeToken(app, key, 2, 1);
	assert.equal(first.allowed, true);
	assert.equal(first.remaining, 1);

	const second = await consumeToken(app, key, 2, 1);
	assert.equal(second.allowed, true);
	assert.equal(second.remaining, 0);

	const third = await consumeToken(app, key, 2, 1);
	assert.equal(third.allowed, false);
	assert.equal(third.remaining, 0);
	assert.ok(third.retryAfterMs > 0);

	await app.redis.del(key);
});

test("refills tokens after elapsed time", async () => {
	const key = `kaze-test:${randomUUID()}`;
	await app.redis.del(key);

	await consumeToken(app, key, 1, 10);
	const denied = await consumeToken(app, key, 1, 10);
	assert.equal(denied.allowed, false);

	await new Promise((resolve) => setTimeout(resolve, 150));
	const refilled = await consumeToken(app, key, 1, 10);
	assert.equal(refilled.allowed, true);

	await app.redis.del(key);
});

test("buckets are isolated by key", async () => {
	const keyA = `kaze-test:${randomUUID()}`;
	const keyB = `kaze-test:${randomUUID()}`;
	await app.redis.del(keyA, keyB);

	await consumeToken(app, keyA, 1, 1);
	const a = await consumeToken(app, keyA, 1, 1);
	assert.equal(a.allowed, false);

	const b = await consumeToken(app, keyB, 1, 1);
	assert.equal(b.allowed, true);

	await app.redis.del(keyA, keyB);
});
