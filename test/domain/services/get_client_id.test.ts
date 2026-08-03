import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";

import { getClientId, parseClientIdentity } from "../../../src/domain/services/get_client_id.ts";

function ctx(headers: Record<string, string | string[] | undefined>, remoteAddress?: string) {
	return { headers, socket: { remoteAddress } };
}

test("extract ip from x-forwarded-for header", () => {
	const identity = parseClientIdentity(ctx({ "x-forwarded-for": "192.168.1.100" }));
	assert.equal(identity.id, "ip:192.168.1.100");
});

test("extract first ip from x-forwarded-for with multiple ips", () => {
	const identity = parseClientIdentity(ctx({ "x-forwarded-for": "192.168.1.100, 10.0.0.1" }));
	assert.equal(identity.ip, "192.168.1.100");
});

test("extract ip from x-real-ip header", () => {
	const identity = parseClientIdentity(ctx({ "x-real-ip": "203.0.113.45" }));
	assert.equal(identity.id, "ip:203.0.113.45");
});

test("prioritize x-forwarded-for over x-real-ip", () => {
	const identity = parseClientIdentity(
		ctx({ "x-forwarded-for": "192.168.1.100", "x-real-ip": "203.0.113.45" }),
	);
	assert.equal(identity.ip, "192.168.1.100");
});

test("fall back to socket remote address", () => {
	const identity = parseClientIdentity(ctx({}, "198.51.100.9"));
	assert.equal(identity.id, "ip:198.51.100.9");
});

test("ignore invalid ip in x-forwarded-for and fall back", () => {
	const identity = parseClientIdentity(
		ctx({ "x-forwarded-for": "not-an-ip", "x-real-ip": "203.0.113.45" }),
	);
	assert.equal(identity.ip, "203.0.113.45");
});

test("return unknown identity when nothing is present", () => {
	const identity = parseClientIdentity(ctx({}));
	assert.deepEqual(identity, { apiKey: null, ip: null, id: "unknown" });
});

test("api key takes precedence over ip and produces a hashed id", () => {
	const identity = parseClientIdentity(
		ctx({ "x-api-key": "secret", "x-forwarded-for": "192.168.1.100" }),
	);
	assert.equal(identity.apiKey, "secret");
	assert.equal(identity.ip, "192.168.1.100");
	assert.match(identity.id, /^api:[0-9a-f]{16}$/);
});

test("same api key produces a stable id", () => {
	const a = parseClientIdentity(ctx({ "x-api-key": "same-key" }));
	const b = parseClientIdentity(ctx({ "x-api-key": "same-key" }));
	assert.equal(a.id, b.id);
});

test("getClientId reads from a real FastifyRequest", async () => {
	const app = Fastify({ logger: false });
	app.get("/", async (req) => getClientId(req));
	await app.ready();

	const res = await app.inject({
		method: "GET",
		url: "/",
		headers: { "x-api-key": "k", "x-forwarded-for": "172.16.0.5" },
	});

	assert.deepEqual(res.json(), { apiKey: "k", ip: "172.16.0.5", id: res.json().id });
	await app.close();
});
