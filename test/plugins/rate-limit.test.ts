import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, before, test } from "node:test";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

import { db } from "../../src/db/index.ts";
import { rateLimitRules } from "../../src/db/schema.ts";
import { build } from "../helper.ts";

const RULE_NAME = "integration-test-rule";

let app: FastifyInstance;
let ruleId: string;

function bucketKey(clientSuffix: string): string {
	return `kaze:${ruleId}:${clientSuffix}`;
}

function apiKeyBucket(apiKey: string): string {
	const hash = createHash("sha256").update(apiKey).digest("hex").slice(0, 16);
	return bucketKey(`api:${hash}`);
}

before(async () => {
	await db.delete(rateLimitRules).where(eq(rateLimitRules.name, RULE_NAME));
	await db.insert(rateLimitRules).values([
		{
			name: RULE_NAME,
			enabled: true,
			priority: 100,
			algorithm: "token_bucket",
			capacity: 3,
			refillRatePerSec: 1,
			matchMethod: null,
			matchPathPattern: "/api/test",
			clientSelectorType: "all",
			clientSelectorValue: null,
		},
	]);
	const [{ id }] = await db
		.select({ id: rateLimitRules.id })
		.from(rateLimitRules)
		.where(eq(rateLimitRules.name, RULE_NAME));
	ruleId = id;

	app = await build((app) => {
		app.get("/api/test", async () => ({ ok: true }));
		app.get("/other/path", async () => ({ ok: true }));
	});
});

after(async () => {
	await db.delete(rateLimitRules).where(eq(rateLimitRules.name, RULE_NAME));
	await app.close();
});

test("allows requests up to the rule capacity", async () => {
	await app.redis.del(bucketKey("ip:127.0.0.1"));

	for (let i = 0; i < 3; i++) {
		const res = await app.inject({ method: "GET", url: "/api/test" });
		assert.notEqual(res.statusCode, 429);
		assert.equal(res.headers["x-ratelimit-limit"], "3");
		assert.ok(Number(res.headers["x-ratelimit-remaining"]) >= 0);
	}
});

test("denies with 429 once the bucket is exhausted", async () => {
	await app.redis.del(bucketKey("ip:127.0.0.1"));

	for (let i = 0; i < 3; i++) {
		await app.inject({ method: "GET", url: "/api/test" });
	}
	const res = await app.inject({ method: "GET", url: "/api/test" });

	assert.equal(res.statusCode, 429);
	assert.deepEqual(res.json(), { message: "Rate limit exceeded" });
	assert.equal(res.headers["x-ratelimit-remaining"], "0");
	assert.ok(Number(res.headers["retry-after"]) >= 1);
	assert.ok(Number(res.headers["x-ratelimit-reset"]) > Math.floor(Date.now() / 1000));
});

test("clients have independent buckets", async () => {
	await app.redis.del(apiKeyBucket("client-a"), apiKeyBucket("client-b"));

	for (let i = 0; i < 3; i++) {
		await app.inject({ method: "GET", url: "/api/test", headers: { "x-api-key": "client-a" } });
	}
	const exhausted = await app.inject({
		method: "GET",
		url: "/api/test",
		headers: { "x-api-key": "client-a" },
	});
	assert.equal(exhausted.statusCode, 429);

	const fresh = await app.inject({
		method: "GET",
		url: "/api/test",
		headers: { "x-api-key": "client-b" },
	});
	assert.notEqual(fresh.statusCode, 429);
});

test("unmatched routes are not rate limited by the rule", async () => {
	const res = await app.inject({ method: "GET", url: "/other/path" });

	assert.equal(res.statusCode, 200);
	assert.equal(res.headers["x-ratelimit-limit"], undefined);
});
