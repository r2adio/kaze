import { readFileSync } from "node:fs";
import path from "node:path";
import type { FastifyInstance } from "fastify";

const script = readFileSync(path.join(import.meta.dirname, "token-bucket.lua"), "utf8");

export interface TokenBucketResult {
	allowed: boolean;
	remaining: number;
	retryAfterMs: number;
}

export async function consumeToken(
	fastify: FastifyInstance,
	key: string,
	capacity: number,
	refillRatePerSec: number,
): Promise<TokenBucketResult> {
	const [allowed, remaining, retryAfterMs] = (await fastify.redis.eval(
		script,
		1,
		key,
		String(capacity),
		String(refillRatePerSec),
		String(Date.now()),
	)) as [number, number, number];

	return { allowed: allowed === 1, remaining, retryAfterMs };
}
