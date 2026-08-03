import { createHash } from "node:crypto";
import net from "node:net";
import type { FastifyRequest } from "fastify";

import type { ClientIdentity } from "../rate-limit/entities.ts";

export interface ClientRequestContext {
	headers: Record<string, string | string[] | undefined>;
	socket?: { remoteAddress?: string };
}

// Identity precedence: api key > x-forwarded-for > x-real-ip > socket ip.
export function getClientId(req: FastifyRequest): ClientIdentity {
	return parseClientIdentity({
		headers: req.headers,
		socket: { remoteAddress: req.socket.remoteAddress },
	});
}

export function parseClientIdentity(ctx: ClientRequestContext): ClientIdentity {
	const apiKey = firstHeader(ctx.headers["x-api-key"]);
	const ip = resolveIp(ctx);

	if (apiKey) {
		const keyHash = createHash("sha256").update(apiKey).digest("hex").slice(0, 16);
		return { apiKey, ip, id: `api:${keyHash}` };
	}
	if (ip) return { apiKey: null, ip, id: `ip:${ip}` };
	return { apiKey: null, ip: null, id: "unknown" };
}

function resolveIp(ctx: ClientRequestContext): string | null {
	const forwarded = firstHeader(ctx.headers["x-forwarded-for"]);
	if (forwarded) {
		const ip = forwarded.split(",")[0]?.trim();
		if (ip && net.isIP(ip)) return ip;
	}
	const realIp = firstHeader(ctx.headers["x-real-ip"]);
	if (realIp && net.isIP(realIp)) return realIp;
	const remoteAddress = ctx.socket?.remoteAddress;
	if (remoteAddress && net.isIP(remoteAddress)) return remoteAddress;
	return null;
}

function firstHeader(value: string | string[] | undefined): string | null {
	if (typeof value === "string") return value;
	if (Array.isArray(value)) return value[0] ?? null;
	return null;
}
