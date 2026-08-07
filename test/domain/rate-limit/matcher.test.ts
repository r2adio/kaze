import assert from "node:assert/strict";
import { test } from "node:test";

import type { ClientIdentity, RateLimitRule } from "../../../src/domain/rate-limit/entities.ts";
import { findApplicableRule } from "../../../src/domain/rate-limit/matcher.ts";

const identity: ClientIdentity = { apiKey: null, ip: "192.0.2.1", id: "ip:192.0.2.1" };

function rule(overrides: Partial<RateLimitRule> = {}): RateLimitRule {
	return {
		id: crypto.randomUUID(),
		name: "rule",
		enabled: true,
		priority: 0,
		algorithm: "token_bucket",
		capacity: 10,
		refillRatePerSec: 1,
		matchMethod: null,
		matchPathPattern: null,
		clientSelectorType: "all",
		clientSelectorValue: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

test("returns undefined when no rule matches", () => {
	const postOnly = rule({ matchMethod: "POST" });
	assert.equal(
		findApplicableRule([postOnly], { method: "GET", path: "/api", identity }),
		undefined,
	);

	const wrongPath = rule({ matchPathPattern: "/api/test" });
	assert.equal(
		findApplicableRule([wrongPath], { method: "GET", path: "/other", identity }),
		undefined,
	);
});

test("a rule without constraints matches everything", () => {
	const r = rule();
	assert.equal(
		findApplicableRule([r], { method: "DELETE", path: "/anything", identity })?.id,
		r.id,
	);
});

test("matches by exact path", () => {
	const r = rule({ matchPathPattern: "/api/test" });
	const result = findApplicableRule([r], { method: "GET", path: "/api/test", identity });
	assert.equal(result?.id, r.id);
});

test("matches by trailing wildcard path", () => {
	const r = rule({ matchPathPattern: "/api/*" });
	assert.equal(
		findApplicableRule([r], { method: "GET", path: "/api/users/1", identity })?.id,
		r.id,
	);
	assert.equal(findApplicableRule([r], { method: "GET", path: "/api", identity }), undefined);
});

test("filters by method", () => {
	const r = rule({ matchMethod: "POST", matchPathPattern: "/login" });
	assert.equal(findApplicableRule([r], { method: "POST", path: "/login", identity })?.id, r.id);
	assert.equal(findApplicableRule([r], { method: "GET", path: "/login", identity }), undefined);
});

test("picks the highest priority rule", () => {
	const low = rule({ matchPathPattern: "/api/*", priority: 1 });
	const high = rule({ matchPathPattern: "/api/*", priority: 10 });
	const result = findApplicableRule([low, high], { method: "GET", path: "/api/test", identity });
	assert.equal(result?.id, high.id);
});

test("breaks priority ties with path specificity", () => {
	const broad = rule({ matchPathPattern: "/api/*" });
	const specific = rule({ matchPathPattern: "/api/test" });
	const result = findApplicableRule([broad, specific], {
		method: "GET",
		path: "/api/test",
		identity,
	});
	assert.equal(result?.id, specific.id);
});

test("skips disabled rules", () => {
	const disabled = rule({ matchPathPattern: "/api/*", enabled: false });
	assert.equal(
		findApplicableRule([disabled], { method: "GET", path: "/api/test", identity }),
		undefined,
	);
});

test("all selector applies to any client", () => {
	const r = rule({ clientSelectorType: "all" });
	assert.equal(findApplicableRule([r], { method: "GET", path: "/api", identity })?.id, r.id);
});

test("api_key selector with value only matches that key", () => {
	const r = rule({ clientSelectorType: "api_key", clientSelectorValue: "secret-a" });
	const keyed = { apiKey: "secret-a", ip: null, id: "api:hash" };
	assert.equal(findApplicableRule([r], { method: "GET", path: "/api", identity: keyed })?.id, r.id);
	assert.equal(
		findApplicableRule([r], {
			method: "GET",
			path: "/api",
			identity: { apiKey: "secret-b", ip: null, id: "api:hash2" },
		}),
		undefined,
	);
	assert.equal(findApplicableRule([r], { method: "GET", path: "/api", identity }), undefined);
});

test("api_key selector without value matches any key but not ip-only clients", () => {
	const r = rule({ clientSelectorType: "api_key" });
	assert.equal(
		findApplicableRule([r], {
			method: "GET",
			path: "/api",
			identity: { apiKey: "anything", ip: null, id: "api:h" },
		})?.id,
		r.id,
	);
	assert.equal(findApplicableRule([r], { method: "GET", path: "/api", identity }), undefined);
});

test("ip selector matches the configured ip", () => {
	const r = rule({ clientSelectorType: "ip", clientSelectorValue: "192.0.2.1" });
	assert.equal(findApplicableRule([r], { method: "GET", path: "/api", identity })?.id, r.id);
	const other = { apiKey: null, ip: "198.51.100.7", id: "ip:198.51.100.7" };
	assert.equal(
		findApplicableRule([r], { method: "GET", path: "/api", identity: other }),
		undefined,
	);
});
