# Kaze

**A high-performance distributed rate limiting service**

Kaze (風, "wind") is a distributed rate limiter built with TypeScript, Fastify, Postgres (Drizzle), and Redis. It ships a token-bucket rate limiter, health/readiness probes, and a Postgres + Redis-backed data plane for distributed enforcement.

## Quick Start

### Prerequisites

- Node.js 22+ and pnpm
- Podman or Docker (Postgres and Redis run in containers). Commands below use `docker compose`; with Podman, substitute `podman compose`.

### Run locally

```bash
pnpm install
cp .env.example .env

# start Postgres + Redis
docker compose up -d postgres redis

# set up the database (once)
pnpm exec drizzle-kit generate   # regenerates migrations from src/db/schema.ts when the schema changes
pnpm db:create
pnpm db:migrate
pnpm db:seed

# run the gateway on the host
pnpm dev
```

The gateway runs on `http://localhost:3000`. DB scripts connect to `localhost:5432` (mapped by the Postgres container). To run the whole stack (gateway included) in containers instead, use `docker compose up -d`.

## Proxy Usage

The gateway is the entry point for all requests. It rate-limits globally (100 req/min) and separately burst-limits unknown paths (3 req / 500 ms).

```bash
curl http://127.0.0.1:3000/livez      # liveness probe, always 200
curl http://127.0.0.1:3000/readyz     # 200 when Postgres + Redis respond, else 503
curl http://127.0.0.1:3000/healthz    # component status with per-dependency latency
```

## Testing

```bash
docker compose up -d postgres redis
pnpm test
```

Runs the `node:test` suite (Node's native TypeScript type-stripping, no build step) and reports coverage via `c8`. The health/readiness tests build the real app and assert against the running services, so Postgres and Redis must be up.

## Resources

- https://youtu.be/MIJFyUPG4Z4
- https://bytebytego.com/courses/system-design-interview/design-a-rate-limiter

## License

MIT
