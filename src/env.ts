import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	PORT: z.coerce.number().default(3000), // read as string, coerce to number
	HOST: z.string().default("0.0.0.0"), // bind all interfaces so container port forwarding works

	LOG_LEVEL: z
		.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
		.default("silent"),

	// graceful shutdown delay (ms)
	FASTIFY_CLOSE_GRACE_DELAY: z.coerce.number().int().nonnegative().default(500),

	// how often the rate-limit rule cache is refreshed from Postgres (ms)
	RULES_REFRESH_MS: z.coerce.number().int().positive().default(60_000),

	DATABASE_URL: z.string().min(1),
	REDIS_URL: z.url().default("redis://localhost:6379"),

	// bearer token required for admin endpoints (control plane)
	ADMIN_API_KEY: z.string().min(1),
});

export type env = z.infer<typeof envSchema>;
let env: env;
try {
	env = envSchema.parse(process.env);
} catch (error) {
	const zodError = error as z.ZodError;
	console.error("Environment variable validation failed:");
	console.error(z.treeifyError(zodError));
	process.exit(1);
}

export default env;
