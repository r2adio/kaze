import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { TokenBucket } from "./token_bucket";

describe("TokenBucket", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	test("should initialize with full capacity tokens", () => {
		const bucket = new TokenBucket(5, 2);
		const allowedRequests = [];
		for (let i = 0; i < 5; i++) {
			allowedRequests.push(bucket.allow());
		}
		expect(allowedRequests).toEqual([true, true, true, true, true]);
		expect(bucket.getTokens()).toBe(0);
		expect(bucket.allow()).toBe(false);
	});

	test("should reject request when no tokens available", () => {
		const bucket = new TokenBucket(1, 1);
		bucket.allow();
		expect(bucket.allow()).toBe(false);
		vi.advanceTimersByTime(999); // refill not yet happened (0.9s)
		expect(bucket.allow()).toBe(false);
	});

	test("should refill tokens over time", () => {
		const bucket = new TokenBucket(2, 2);
		bucket.allow();
		bucket.allow();
		expect(bucket.allow()).toBe(false);

		vi.advanceTimersByTime(1000);
		expect(bucket.allow()).toBe(true);
	});

	test("should not exceed capacity when refilling", () => {
		const bucket = new TokenBucket(3, 5);
		bucket.allow();
		vi.advanceTimersByTime(2000);

		for (let i = 0; i < 3; i++) {
			expect(bucket.allow()).toBe(true);
		}
		expect(bucket.allow()).toBe(false);
	});
});
