/**
 * Kaze - Distributed Rate Limiter
 *
 * A high-performance distributed rate limiting service.
 * Inspired by: "Design a Distributed Rate Limiter w/ Ex-Meta Staff Engineer"
 * by Hello Interview - SWE Interview Preparation
 */

import Fastify from "fastify";

const PORT = Number(process.env.PORT) || 3000;

const VERSION = process.env.npm_package_version || "0.1.0";

const fastify = Fastify({ logger: true });

fastify.get("/health", async () => {
	return {
		status: "healthy",
		service: "kaze",
		version: VERSION,
		timestamp: new Date().toISOString(),
	};
});

fastify.get("/ready", async () => {
	// TODO: check redis/postgres connectivity.
	return {
		status: "ready",
		service: "kaze",
		version: VERSION,
		timestamp: new Date().toISOString(),
	};
});

fastify.get("/", async () => {
	return {
		message: "Kaze - Distributed Rate Limiter",
		version: VERSION,
		documentation: "https://github.com/r2adio/kaze",
		endpoints: {
			health: "/health",
			ready: "/ready",
		},
	};
});

try {
	const addr = await fastify.listen({ port: PORT, host: "0.0.0.0" });
	fastify.log.info({ addr }, "server listening");
} catch (err) {
	fastify.log.error(err);
	process.exit(1);
}
