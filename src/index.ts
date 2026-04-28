/**
 * Kaze - Distributed Rate Limiter
 *
 * A high-performance distributed rate limiting service.
 * Inspired by: "Design a Distributed Rate Limiter w/ Ex-Meta Staff Engineer"
 * by Hello Interview - SWE Interview Preparation
 */

import http from "node:http";

const PORT = Number(process.env.PORT) || 3000;

const VERSION = process.env.npm_package_version || "0.1.0";

const server = http.createServer((req, res) => {
	if (!req.url) {
		res.writeHead(400, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: "Bad Request" }));
		return;
	}

	const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

	// TODO: Rate limiting middleware will be applied in phase 1

	if (url.pathname === "/health") {
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(
			JSON.stringify({
				status: "healthy",
				service: "kaze",
				version: VERSION,
				timestamp: new Date().toISOString(),
			}),
		);
		return;
	}

	if (url.pathname === "/") {
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(
			JSON.stringify({
				message: "Kaze - Distributed Rate Limiter",
				version: VERSION,
				documentation: "https://github.com/r2adio/kaze",
				endpoints: { health: "/health" },
			}),
		);
		return;
	}

	res.writeHead(404, { "Content-Type": "application/json" });
	res.end(
		JSON.stringify({
			error: "Not Found",
			message: `Endpoint ${url.pathname} not found`,
		}),
	);
});

server.listen(PORT, () => {
	console.log(`Kaze server running on http://localhost:${PORT}`);
});
