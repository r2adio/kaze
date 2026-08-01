import assert from "node:assert/strict";
import { test } from "node:test";

import { TokenBucket } from "../../../src/domain/entities/token_bucket.ts";

test("should initialize with full capacity tokens", (t) => {
	t.mock.timers.enable({ apis: ["Date"] });
	const bucket = new TokenBucket(5, 2);

	const results = Array.from({ length: 5 }, () => bucket.allow());

	assert.deepEqual(results, [true, true, true, true, true]);
	assert.equal(bucket.getTokens(), 0);
	assert.equal(bucket.allow(), false);
});

test("should reject request when no tokens available", (t) => {
	t.mock.timers.enable({ apis: ["Date"] });
	const bucket = new TokenBucket(1, 1);

	assert.equal(bucket.allow(), true);
	assert.equal(bucket.allow(), false);

	t.mock.timers.tick(999); // 0.999s elapsed, not enough to refill 1 token
	assert.equal(bucket.allow(), false);
});

test("should refill tokens over time", (t) => {
	t.mock.timers.enable({ apis: ["Date"] });
	const bucket = new TokenBucket(2, 2);

	assert.equal(bucket.allow(), true);
	assert.equal(bucket.allow(), true);
	assert.equal(bucket.allow(), false);

	t.mock.timers.tick(1000);
	assert.equal(bucket.allow(), true);
});

test("should not exceed capacity when refilling", (t) => {
	t.mock.timers.enable({ apis: ["Date"] });
	const bucket = new TokenBucket(3, 5);

	assert.equal(bucket.allow(), true);
	t.mock.timers.tick(2000);

	const results = Array.from({ length: 3 }, () => bucket.allow());

	assert.deepEqual(results, [true, true, true]);
	assert.equal(bucket.allow(), false);
});
