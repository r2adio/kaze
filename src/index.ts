/**
 * Kaze - Distributed Rate Limiter
 *
 * A high-performance distributed rate limiting service.
 * Inspired by: "Design a Distributed Rate Limiter w/ Ex-Meta Staff Engineer"
 * by Hello Interview - SWE Interview Preparation
 */

import { serve } from "bun";
import packageJson from "../package.json";

const PORT = Number(process.env.PORT) || 3000;

const server = serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);

    // TODO: Rate limiting middleware will be applied in phase 1

    // Health check endpoint
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          service: "kaze",
          version: packageJson.version || "0.1.0",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Root endpoint - service information
    if (url.pathname === "/") {
      return new Response(
        JSON.stringify({
          message: "Kaze - Distributed Rate Limiter",
          version: packageJson.version || "0.1.0",
          documentation: "https://github.com/r2adio/kaze",
          endpoints: { health: "/health" },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 404 for unknown endpoints
    return new Response(
      JSON.stringify({
        error: "Not Found",
        message: `Endpoint ${url.pathname} not found`,
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      },
    );
  },
});

console.log(`🚀 Kaze server running on http://localhost:${PORT}`);
