import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { RuleCache } from "../../application/rule-cache.ts";
import { findApplicableRule } from "../../domain/rate-limit/matcher.ts";
import { getClientId } from "../../domain/services/get_client_id.ts";
import env from "../../env.ts";
import { consumeToken } from "../../infrastructure/redis/token-bucket.ts";

async function rateLimitPlugin(fastify: FastifyInstance) {
	const cache = new RuleCache(env.RULES_REFRESH_MS, fastify.log);

	fastify.decorate("ruleCache", cache);

	fastify.addHook("onReady", async () => {
		await cache.refresh();
		cache.start();
	});

	fastify.addHook("onClose", async () => {
		await cache.stop();
	});

	fastify.addHook("onRequest", async (req, reply) => {
		const identity = getClientId(req);
		const rule = findApplicableRule(cache.get(), {
			method: req.method,
			path: req.url.split("?")[0],
			identity,
		});
		if (!rule) return;

		const result = await consumeToken(
			fastify,
			`kaze:${rule.id}:${identity.id}`,
			rule.capacity,
			rule.refillRatePerSec,
		);

		reply.header("X-RateLimit-Limit", rule.capacity);
		reply.header("X-RateLimit-Remaining", result.remaining);

		if (!result.allowed) {
			reply.header("Retry-After", Math.ceil(result.retryAfterMs / 1000));
			reply.code(429);
			reply.send({ message: "Rate limit exceeded" });
			return reply;
		}
	});
}

declare module "fastify" {
	interface FastifyInstance {
		ruleCache: RuleCache;
	}
}

export default fp(rateLimitPlugin);
