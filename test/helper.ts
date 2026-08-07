// Builds a Fastify instance with the app registered for testing,
// mirroring the fastify-cli helper. Mirrors src/server.ts but skips
// listening and exposes the instance for inject().
//
// The app registers the real Redis client and pg pool, so health tests
// exercise the running dev services (docker compose up -d).

import type { FastifyInstance } from "fastify";
import Fastify from "fastify";
import fp from "fastify-plugin";

import serviceApp from "../src/app.ts";

// The pg pool is a module-level singleton that the db plugin ends on app
// close, so each test file should build one app (before/after) rather
// than building per test.
export async function build(register?: (app: FastifyInstance) => void): Promise<FastifyInstance> {
	const app = Fastify({ logger: false });

	// fastify-plugin ensures decorators and error handlers are applied
	// at the root scope, matching the production entry point.
	app.register(fp(serviceApp));

	// Test-only routes for exercising error handlers that share the
	// root-scope handlers installed by serviceApp.
	register?.(app);

	await app.ready();

	return app;
}
