import { TokenBucket } from "./token_bucket";
import { describe, it, expect, beforeEach, afterEach, jest } from "bun:test";

describe("TokenBucket", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should initialize with full capacity tokens", () => {
    const bucket = new TokenBucket(5, 2);
    const allowedRequests = [];
    for (let i = 0; i < 5; i++) {
      allowedRequests.push(bucket.allow());
    }
    expect(allowedRequests).toEqual([true, true, true, true, true]);
    expect(bucket.getTokens()).toBe(0);
    expect(bucket.allow()).toBe(false);
  });

  it("should reject request when no tokens available", () => {
    const bucket = new TokenBucket(1, 1);
    bucket.allow();
    expect(bucket.allow()).toBe(false);
    jest.advanceTimersByTime(999); // refill not yet happened (0.9s)
    expect(bucket.allow()).toBe(false);
  });

  it("should refill tokens over time", () => {
    const bucket = new TokenBucket(2, 2);
    bucket.allow();
    bucket.allow();
    expect(bucket.allow()).toBe(false);

    jest.advanceTimersByTime(1000);
    expect(bucket.allow()).toBe(true);
  });

  it("should not exceed capacity when refilling", () => {
    const bucket = new TokenBucket(3, 5);
    bucket.allow();
    jest.advanceTimersByTime(2000);

    for (let i = 0; i < 3; i++) {
      expect(bucket.allow()).toBe(true);
    }
    expect(bucket.allow()).toBe(false);
  });

  it("should handle fractional tokens correctly", () => {
    const bucket = new TokenBucket(10, 0.5);

    for (let i = 0; i < 10; i++) {
      bucket.allow();
    }
    expect(bucket.allow()).toBe(false);

    jest.advanceTimersByTime(2000);
    expect(bucket.allow()).toBe(true);
    expect(bucket.allow()).toBe(false);
  });

  it("should handle burst requests", () => {
    const bucket = new TokenBucket(10, 1);

    const burstResults = [];
    for (let i = 0; i < 10; i++) {
      burstResults.push(bucket.allow());
    }
    expect(burstResults.every((result) => result === true)).toBe(true);
    expect(bucket.allow()).toBe(false);
  });

  it("should maintain steady rate after burst", () => {
    const bucket = new TokenBucket(5, 1);

    for (let i = 0; i < 5; i++) {
      bucket.allow();
    }
    expect(bucket.allow()).toBe(false);

    jest.advanceTimersByTime(1000);
    expect(bucket.allow()).toBe(true);
    expect(bucket.allow()).toBe(false);

    jest.advanceTimersByTime(1000);
    expect(bucket.allow()).toBe(true);
    expect(bucket.allow()).toBe(false);
  });

  it("should handle zero fill rate", () => {
    const bucket = new TokenBucket(2, 0);
    bucket.allow();
    bucket.allow();
    expect(bucket.allow()).toBe(false);

    jest.advanceTimersByTime(10000);
    expect(bucket.allow()).toBe(false);
  });

  it("should handle very small time intervals", () => {
    const bucket = new TokenBucket(1, 10);
    bucket.allow();
    expect(bucket.allow()).toBe(false);

    jest.advanceTimersByTime(100);
    expect(bucket.getTokens()).toBe(1);
    expect(bucket.allow()).toBe(true);
  });
});

