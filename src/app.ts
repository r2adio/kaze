// core Fastify application instance and its plugins/routes.
// It's responsible for setting up the application's structure, middleware,
// and business logic, but not starting the HTTP server itself.
// Exports a function that registers plugins and sets up application-level configurations.
// This separation makes the app instance highly testable without a running server.

import path from "node:path";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyAutoload from "@fastify/autoload";
import { FastifyError, FastifyInstance, FastifyPluginOptions } from "fastify";

export default async function serviceApp(
	fastify: FastifyInstance,
	opts: FastifyPluginOptions,
) {
	await fastify.register(fastifyRateLimit, {
		// options for rate limiting, can be adjusted as needed
		max: 100, // max requests per window
		timeWindow: "1 minute",
	});
	await fastify.register(fastifyAutoload, {
		dir: path.join(import.meta.dirname, "plugins/external"),
		options: {},
	});

	fastify.register(fastifyAutoload, {
		dir: path.join(import.meta.dirname, "plugins/app"),
		options: { ...opts },
	});

	fastify.register(fastifyAutoload, {
		dir: path.join(import.meta.dirname, "routes"),
		autoHooks: true,
		cascadeHooks: true,
		options: { ...opts },
	});

	fastify.setErrorHandler((err: FastifyError, req, res) => {
		fastify.log.error(
			{
				err,
				req: {
					method: req.method,
					url: req.url,
					query: req.query,
					params: req.params,
				},
			},
			"Unhandled error occurred",
		);

		res.code(err.statusCode ?? 500);

		let message = "Internal Server Error";
		if (err.statusCode && err.statusCode < 500) {
			message = err.message;
		}

		return { message };
	});

	fastify.setNotFoundHandler(
		{
			preHandler: fastify.rateLimit({ max: 3, timeWindow: 500 }),
		},
		(req, res) => {
			req.log.warn(
				{
					req: {
						method: req.method,
						url: req.url,
						query: req.query,
						params: req.params,
					},
				},
				"Resource not found",
			);
			res.code(404);
			return { message: "Not found" };
		},
	);
}
