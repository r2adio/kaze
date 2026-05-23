/**
 * Kaze - Distributed Rate Limiter
 *
 * A high-performance distributed rate limiting service.
 * Inspired by: "Design a Distributed Rate Limiter w/ Ex-Meta Staff Engineer"
 * by Hello Interview - SWE Interview Preparation
 */
import { buildServer } from "@/app";

const PORT = Number(process.env.PORT) || 3000;
const UPSTREAM_BASE_URL =
	process.env.UPSTREAM_BASE_URL || "http://127.0.0.1:4000";

const fastify = buildServer({ upstreamBaseUrl: UPSTREAM_BASE_URL });

try {
	const addr = await fastify.listen({ port: PORT, host: "0.0.0.0" });
	fastify.log.info({ addr }, "server listening");
} catch (err) {
	fastify.log.error(err);
	process.exit(1);
}
