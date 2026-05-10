import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { buildServer } from "../../src/app";

const createUpstream = () => {
	const upstream = Fastify({ logger: false });

	upstream.get("/resource", async (request) => {
		return {
			message: "upstream resource",
			method: request.method,
			path: request.url,
		};
	});

	upstream.get("/echo", async (request) => {
		const header = request.headers["x-request-id"];
		const requestId = Array.isArray(header) ? header[0] : (header ?? null);

		return {
			requestId,
			query: request.query,
		};
	});

	return upstream;
};

describe("gateway proxy", () => {
	let upstream: ReturnType<typeof createUpstream>;
	let gateway: ReturnType<typeof buildServer>;
	let upstreamAddr: string;
	let gatewayAddr: string;

	beforeAll(async () => {
		upstream = createUpstream();
		upstreamAddr = await upstream.listen({ port: 0, host: "127.0.0.1" });

		gateway = buildServer({ upstreamBaseUrl: upstreamAddr, logger: false });
		gatewayAddr = await gateway.listen({ port: 0, host: "127.0.0.1" });
	});

	afterAll(async () => {
		await gateway.close();
		await upstream.close();
	});

	test("forwards responses from upstream", async () => {
		const url = new URL("/resource?foo=bar", gatewayAddr).toString();
		const res = await fetch(url);
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual({
			message: "upstream resource",
			method: "GET",
			path: "/resource?foo=bar",
		});
	});

	test("adds x-request-id when missing", async () => {
		const url = new URL("/echo", gatewayAddr).toString();
		const res = await fetch(url);
		const body = await res.json();

		expect(typeof body.requestId).toBe("string");
		expect(body.requestId.length).toBeGreaterThan(10);
	});

	test("preserves provided x-request-id", async () => {
		const url = new URL("/echo", gatewayAddr).toString();
		const res = await fetch(url, {
			headers: {
				"x-request-id": "test-request-id",
			},
		});
		const body = await res.json();

		expect(body.requestId).toBe("test-request-id");
	});
});
