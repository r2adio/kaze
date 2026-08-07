import fastifyRedis from "@fastify/redis";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

async function redisPlugin(fastify: FastifyInstance) {
	await fastify.register(fastifyRedis, { url: fastify.env.REDIS_URL });
}

export default fp(redisPlugin);

// NOTE: using redis inside a route:
// app.get('/cache', async (request, reply) => {
//   await app.redis.set("hello", "world");
//   const value = await app.redis.get("hello");
//   return {value};
// });
