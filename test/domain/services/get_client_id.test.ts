import assert from "node:assert/strict";
import { test } from "node:test";

import getClientIP from "../../../src/domain/services/get_client_id.ts";

function createRequestWithHeaders(headers: Record<string, string>): Request {
	return new Request("http://localhost:3000", {
		headers: new Headers(headers),
	});
}

test("extract ip from x-forwarded-for header", () => {
	const ip = getClientIP(createRequestWithHeaders({ "x-forwarded-for": "192.168.1.100" }));
	assert.equal(ip, "192.168.1.100");
});

test("extract first ip from x-forwarded-for with multiple ips", () => {
	const ip = getClientIP(
		createRequestWithHeaders({ "x-forwarded-for": "192.168.1.100, 10.0.0.1, 172.16.0.1" }),
	);
	assert.equal(ip, "192.168.1.100");
});

test("extract ip from x-real-ip header", () => {
	const ip = getClientIP(createRequestWithHeaders({ "x-real-ip": "203.0.113.45" }));
	assert.equal(ip, "203.0.113.45");
});

test("prioritize x-forwarded-for over x-real-ip", () => {
	const ip = getClientIP(
		createRequestWithHeaders({
			"x-forwarded-for": "192.168.1.100",
			"x-real-ip": "203.0.113.45",
		}),
	);
	assert.equal(ip, "192.168.1.100");
});

test("return undefined when no headers present", () => {
	const ip = getClientIP(createRequestWithHeaders({}));
	assert.equal(ip, undefined);
});

test("return undefined for invalid ip in x-forwarded-for", () => {
	const ip = getClientIP(createRequestWithHeaders({ "x-forwarded-for": "not-an-ip" }));
	assert.equal(ip, undefined);
});
