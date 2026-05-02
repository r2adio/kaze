import Fastify from "fastify";

const PORT = Number(process.env.UPSTREAM_PORT) || 4000;

const fastify = Fastify({ logger: true });

fastify.get("/ping", async () => {
	return {
		ok: true,
		service: "upstream-demo",
		timestamp: new Date().toISOString(),
	};
});

fastify.get("/resource", async (request) => {
	return {
		message: "upstream resource",
		method: request.method,
		path: request.url,
		timestamp: new Date().toISOString(),
	};
});

fastify.get("/slow", async (request) => {
	const msValue = request.query as { ms?: string };
	const waitMs = Number(msValue.ms) || 200;

	await new Promise((resolve) => setTimeout(resolve, waitMs));

	return {
		message: "slow response",
		waitMs,
		timestamp: new Date().toISOString(),
	};
});

fastify.all("/echo", async (request) => {
	return {
		message: "echo",
		method: request.method,
		path: request.url,
		headers: {
			"x-request-id": request.headers["x-request-id"] ?? null,
			"x-forwarded-for": request.headers["x-forwarded-for"] ?? null,
			"x-real-ip": request.headers["x-real-ip"] ?? null,
		},
		timestamp: new Date().toISOString(),
	};
});

fastify.get("/health", async () => {
	return {
		status: "healthy",
		service: "upstream-demo",
		timestamp: new Date().toISOString(),
	};
});

try {
	const addr = await fastify.listen({ port: PORT, host: "0.0.0.0" });
	fastify.log.info({ addr }, "upstream demo listening");
} catch (err) {
	fastify.log.error(err);
	process.exit(1);
}
