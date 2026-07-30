import { fastifyPlugin } from "fastify-plugin";
import { db, pool } from "../../db";

export default fastifyPlugin(async (fastify) => {
	fastify.decorate("db", db);

	fastify.addHook("onClose", async () => {
		await pool.end();
	});
});

declare module "fastify" {
	interface FastifyInstance {
		db: typeof db;
	}
}
