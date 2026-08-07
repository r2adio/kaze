// The entry point for running the Fastify application.
// It initializes the Fastify server instance, configures logging,
// sets up graceful shutdown handling, and starts the HTTP server.
// It imports the application instance defined in app.ts and registers it.

import closeWithGrace from "close-with-grace";
import Fastify from "fastify";
import fp from "fastify-plugin";

import serviceApp from "./app.ts";
import env from "./env.ts";

function getLoggerOptions() {
	// if program running in interactive terminal
	if (process.stdout.isTTY) {
		return {
			level: "info",
			transport: {
				target: "pino-pretty",
				options: { translateTime: "HH:MM:ss Z", ignore: "pid,hostname" },
			},
		};
	}
	return { level: env.LOG_LEVEL };
}

const app = Fastify({
	logger: getLoggerOptions(),
	// timeouts to prevent slow/idle clients from holding connections open
	connectionTimeout: 120_000,
	requestTimeout: 60_000,
	keepAliveTimeout: 10_000,
	http: { headersTimeout: 15_000 },
	ajv: {
		customOptions: {
			coerceTypes: "array", // change type of data to match type keyword
			removeAdditional: "all", // remove additional body properties
		},
	},
});

async function closeYourServer() {
	console.log("Server closing...");
	await app.close();
	console.log("Server closed.");
}

async function init() {
	// registers your application as a normal plugin.
	// fp must be used to override default error handler
	app.register(fp(serviceApp));

	// delay is the number of milliseconds for the graceful close to finish
	closeWithGrace(
		{ delay: env.FASTIFY_CLOSE_GRACE_DELAY },
		// signal, manual are available with err
		async ({ err }) => {
			if (err) console.error(err);
			await closeYourServer();
		},
	);
	await app.ready();

	try {
		await app.listen({ host: env.HOST, port: env.PORT });
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
}

init();
