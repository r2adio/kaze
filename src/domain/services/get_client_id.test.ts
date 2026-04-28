import { describe, expect, test } from "vitest";
import getClientIP from "./get_client_id";

// helper function: create req for tests
function createRequestWithHeaders(headers: Record<string, string>): Request {
	return new Request("http://localhost:3000", {
		headers: new Headers(headers),
	});
}

describe("getClientIP", () => {
	test("extract ip from x-forwarded-for header", () => {
		const req = createRequestWithHeaders({
			"x-forwarded-for": "192.168.1.100",
		});
		const ip = getClientIP(req);
		expect(ip).toBe("192.168.1.100");
	});

	test("extract first ip from x-forwarded-for with multiple ips", () => {
		const req = createRequestWithHeaders({
			"x-forwarded-for": "192.168.1.100, 10.0.0.1, 172.16.0.1",
		});
		const ip = getClientIP(req);
		expect(ip).toBe("192.168.1.100");
	});

	test("extract ip from x-real-ip header", () => {
		const req = createRequestWithHeaders({
			"x-real-ip": "203.0.113.45",
		});
		const ip = getClientIP(req);
		expect(ip).toBe("203.0.113.45");
	});

	test("prioritize x-forwarded-for over x-real-ip", () => {
		const req = createRequestWithHeaders({
			"x-forwarded-for": "192.168.1.100",
			"x-real-ip": "203.0.113.45",
		});
		const ip = getClientIP(req);
		expect(ip).toBe("192.168.1.100");
	});

	test("return undefined when no headers present", () => {
		const req = createRequestWithHeaders({});
		const ip = getClientIP(req);
		expect(ip).toBeUndefined();
	});

	test("return undefined for invalid ip in x-forwarded-for", () => {
		const req = createRequestWithHeaders({
			"x-forwarded-for": "not-an-ip",
		});
		const ip = getClientIP(req);
		expect(ip).toBeUndefined();
	});
});
