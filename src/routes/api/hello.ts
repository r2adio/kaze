import type { FastifyInstance } from "fastify";

export default async function helloRoute(fastify: FastifyInstance) {
	fastify.get("/hello", async () => ({ message: "hello" }));
}
