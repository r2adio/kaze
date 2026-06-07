import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	PORT: z.coerce.number().default(3000), // read as string, coerce to number
	UPSTREAM_BASE_URL: z.string().url().default("http://127.0.0.1:4000"),


	// rule cache refresh interval
	RULES_REFRESH_MS: z.coerce.number().int().positive().default(5000),

	// postgres
	DATABASE_URL: z.string().min(1),

	// redis
	REDIS_HOST: z.string().min(1).default("localhost"),
	REDIS_PORT: z.coerce.number().int().positive().default(6379),
	REDIS_PASSWORD: z.string().optional().default(""),
	REDIS_DB: z.coerce.number().int().nonnegative().default(0),
	REDIS_KEY_PREFIX: z.string().default("kaze:"),
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
