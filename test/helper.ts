// Builds a Fastify instance with the app registered for testing,
// mirroring the fastify-cli helper. Mirrors src/server.ts but skips
// listening and exposes the instance for inject().
//
// Redis and the pg pool are mocked so the test suite runs without
// external services. Swap the mocks for the real modules once Redis
// and Postgres are wired into the dev environment.

import { mock } from "node:test";
import type { FastifyInstance } from "fastify";
import Fastify from "fastify";
import fp from "fastify-plugin";

import serviceApp from "../src/app.ts";

const fakeRedis = {
	ping: async () => {
		await new Promise((resolve) => setTimeout(resolve, 5));
		return "PONG" as const;
	},
};

const fakeRedisPlugin = fp(async (fastify: FastifyInstance) => {
	fastify.decorate("redis", fakeRedis as unknown as FastifyInstance["redis"]);
});

const fakePool = {
	query: async () => {
		await new Promise((resolve) => setTimeout(resolve, 5));
		return { rows: [] };
	},
	end: async () => {},
};

// Replace external services before the app boots.
mock.module("@fastify/redis", {
	defaultExport: fakeRedisPlugin,
});
mock.module("../src/db/index.ts", {
	namedExports: { pool: fakePool, db: {} },
});

export type TestContext = {
	after: (fn: () => void | Promise<void>) => void;
};

export async function build(t: TestContext): Promise<FastifyInstance> {
	const app = Fastify({ logger: false });

	// fastify-plugin ensures decorators and error handlers are applied
	// at the root scope, matching the production entry point.
	app.register(fp(serviceApp));

	// Register cleanup before ready() so any clients are released even
	// if boot fails, keeping the test process from hanging.
	t.after(async () => {
		await app.close().catch(() => {});
	});

	await app.ready();

	return app;
}
