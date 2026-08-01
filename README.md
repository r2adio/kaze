# Kaze

**A high-performance distributed rate limiting service**

Kaze (風, "wind") is a distributed rate limiter built with TypeScript, Fastify, Postgres (Drizzle), and Redis. It ships a token-bucket rate limiter, health/readiness probes, and a Postgres + Redis-backed data plane for distributed enforcement.

## Quick Start

### Prerequisites

- Node.js 22+ and pnpm
- Docker (Postgres and Redis run in containers)

### Run locally

```bash
pnpm install
cp .env.example .env

# start Postgres + Redis (+ the app in a container)
docker compose up -d

# set up the database
pnpm exec drizzle-kit generate   # once, to generate migrations from src/db/schema.ts
pnpm db:create
pnpm db:migrate
pnpm db:seed

# run the gateway on your host instead of the container
docker compose up -d postgres redis
pnpm dev
```

The gateway runs on `http://localhost:3000`. DB scripts connect to `localhost:5432` (mapped by Postgres container).

## Proxy Usage

The gateway is the entry point for all requests. It rate-limits globally (100 req/min) and separately burst-limits unknown paths (3 req / 500 ms).

```bash
curl http://127.0.0.1:3000/livez      # liveness probe, always 200
curl http://127.0.0.1:3000/readyz     # 200 when Postgres + Redis respond, else 503
curl http://127.0.0.1:3000/healthz    # component status with per-dependency latency
```

## Testing

```bash
pnpm test
```

Runs the `node:test` suite (Node's native TypeScript type-stripping, no build step) and reports coverage via `c8`. The tests mock Postgres and Redis, so they run without containers.

## Resources

- https://youtu.be/MIJFyUPG4Z4
- https://bytebytego.com/courses/system-design-interview/design-a-rate-limiter

## License

MIT
