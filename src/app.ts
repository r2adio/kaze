import { randomUUID } from "node:crypto";
import replyFrom from "@fastify/reply-from";
import Fastify from "fastify";
import { pool } from "@/db";
import { redis } from "./redis";

type AppOptions = {
	upstreamBaseUrl: string;
	logger?: boolean;
};

export function buildServer({ upstreamBaseUrl, logger = true }: AppOptions) {
	const fastify = Fastify({
		logger,
		genReqId: () => randomUUID(),
	});

	fastify.get("/health", async (_request, reply) => {
		const checks = await Promise.allSettled([
			(async () => {
				const start = performance.now();

				await pool.query("SELECT 1");

				return {
					status: "UP",
					latencyMs: Math.round(performance.now() - start),
				};
			})(),

			(async () => {
				const start = performance.now();

				await redis.ping();

				return {
					status: "UP",
					latencyMs: Math.round(performance.now() - start),
				};
			})(),
		]);

		const [dbCheck, redisCheck] = checks;

		const database =
			dbCheck.status === "fulfilled"
				? {
						status: "UP",
						details: {
							database: "PostgreSQL",
							latencyMs: dbCheck.value.latencyMs,
						},
					}
				: {
						status: "DOWN",
						details: {
							database: "PostgreSQL",
							error:
								dbCheck.reason instanceof Error
									? dbCheck.reason.message
									: String(dbCheck.reason),
						},
					};

		const cache =
			redisCheck.status === "fulfilled"
				? {
						status: "UP",
						details: {
							cache: "Redis",
							latencyMs: redisCheck.value.latencyMs,
						},
					}
				: {
						status: "DOWN",
						details: {
							cache: "Redis",
							error:
								redisCheck.reason instanceof Error
									? redisCheck.reason.message
									: String(redisCheck.reason),
						},
					};

		const isReady = database.status === "UP" && cache.status === "UP";

		reply.code(isReady ? 200 : 503);

		return {
			status: isReady ? "UP" : "DOWN",
			components: {
				database,
				cache,
			},
		};
	});

	fastify.get("/info", async () => {
		return {
			status: "running",
			environment: process.env.NODE_ENV ?? "development",
			version: process.env.npm_package_version || "0.1.0",
			uptime: process.uptime(),
			system: {
				cpuTime: process.cpuUsage(),
				memoryUsage: process.memoryUsage(),
			},
		};
	});

	fastify.get("/", async () => {
		return {
			message: "Kaze",
			description: "Distributed Rate Limiter",
			version: process.env.npm_package_version,
			documentation: "https://github.com/r2adio/kaze",
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
