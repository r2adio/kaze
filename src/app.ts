import { randomUUID } from "node:crypto";
import replyFrom from "@fastify/reply-from";
import Fastify from "fastify";

type AppOptions = {
	upstreamBaseUrl: string;
	logger?: boolean;
};

export function buildServer({ upstreamBaseUrl, logger = true }: AppOptions) {
	const fastify = Fastify({
		logger,
		genReqId: () => randomUUID(),
	});

	fastify.get("/health", async () => {
		return {
			status: "healthy",
			service: "kaze",
			version: process.env.npm_package_version || "0.1.0",
			timestamp: new Date().toISOString(),
		};
	});

	fastify.get("/ready", async () => {
		// TODO: check redis/postgres connectivity.
		return {
			status: "ready",
			service: "kaze",
			version: process.env.npm_package_version || "0.1.0",
			timestamp: new Date().toISOString(),
		};
	});

	fastify.get("/", async () => {
		return {
			message: "Kaze - Distributed Rate Limiter",
			version: process.env.npm_package_version || "0.1.0",
			documentation: "https://github.com/r2adio/kaze",
			endpoints: {
				health: "/health",
				ready: "/ready",
			},
		};
	});

	fastify.addHook("onSend", async (request, reply) => {
		if (!reply.getHeader("x-request-id")) {
			reply.header("x-request-id", request.id);
		}
	});

	fastify.addHook("onRequest", async (request) => {
		if (!request.headers["x-request-id"]) {
			request.headers["x-request-id"] = request.id;
		}
	});

	fastify.register(replyFrom, {
		base: upstreamBaseUrl,
	});

	fastify.setNotFoundHandler(async (request, reply) => {
		const headers = {
			...request.headers,
			"x-request-id": request.headers["x-request-id"],
		};
		reply.headers(headers);

		return reply.from(request.url, {
			body: request.body,
			method: request.method,
		});
	});

	return fastify;
}
