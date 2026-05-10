# Kaze

**A high-performance distributed rate limiting gateway**

Kaze (Japanese for "wind" 風) is a distributed rate limiter built with TypeScript and Node. It runs as a reverse-proxy gateway in front of an upstream API, and will progressively add a rules control plane (Postgres + Drizzle) and distributed enforcement (Redis + atomic token bucket).

## Project Status

**Current focus:** Week 1 - Reverse Proxy Gateway (in progress)

### Implemented

- Token Bucket algorithm with tests
- Fastify gateway with health/ready endpoints
- Reverse-proxying via `@fastify/reply-from`
- Request ID propagation (`x-request-id`)
- Upstream demo API for proxy validation
- Integration tests for proxy behavior

### Next up

- Postgres + Drizzle rules control plane
- Redis token-bucket enforcement (atomic Lua)
- Local distributed demo + k6 benchmarking
- Production hardening + DigitalOcean deploy

## Quick Start

### Prerequisites

- Node 22+ recommended (production targets Node 22 LTS)
- Git

### Installation

```bash
git clone https://github.com/r2adio/kaze
cd kaze

npm install
cp .env.example .env.local

npm run test
npm run dev:all
```

Gateway runs on `http://localhost:3000` and upstream demo on `http://localhost:4000`.

## Configuration

Copy `.env.example` to `.env.local` and adjust as needed. The most important variables
for current development are:

- `PORT`
- `UPSTREAM_BASE_URL`

### Available Scripts

```bash
npm run dev            # Start gateway (dev)
npm run dev:upstream   # Start upstream demo service (dev)
npm run dev:all        # Start gateway + upstream
npm run build          # Build for production (tsc)
npm run start          # Start production server
npm run test           # Run all tests
npm run test:watch     # Run tests in watch mode
```

## Project Structure

```text
kaze/
├── src/
│   ├── app.ts                 # Fastify server + proxy
│   ├── index.ts               # Server entrypoint
│   └── domain/
│       ├── entities/          # Token bucket algorithm
│       └── services/          # Client ID extraction
├── tests/
│   └── integration/           # Gateway proxy tests
├── upstream/                  # Demo upstream API
│   └── src/index.ts
├── .env.example
├── package.json
└── README.md
```

## Gateway Behavior

- `GET /health` and `GET /ready` are served by Kaze.
- `GET /` returns service metadata.
- Any other path is **proxied** to the upstream service.
- Kaze ensures `x-request-id` is present on all proxied requests.

## Proxy Usage

Start both services:

```bash
npm run dev:all
```

Send requests to the gateway:

```bash
curl http://127.0.0.1:3000/ping
curl http://127.0.0.1:3000/resource
curl "http://127.0.0.1:3000/slow?ms=200"
curl http://127.0.0.1:3000/echo
```

Hit upstream directly (debug only):

```bash
curl http://127.0.0.1:4000/ping
```

## API Documentation

### Gateway Endpoints

#### `GET /health`

```json
{
  "status": "healthy",
  "service": "kaze",
  "version": "0.1.0",
  "timestamp": "2026-04-03T10:30:00.000Z"
}
```

#### `GET /ready`

```json
{
  "status": "ready",
  "service": "kaze",
  "version": "0.1.0",
  "timestamp": "2026-04-03T10:30:00.000Z"
}
```

#### `GET /`

```json
{
  "message": "Kaze - Distributed Rate Limiter",
  "version": "0.1.0",
  "documentation": "https://github.com/r2adio/kaze",
  "endpoints": {
    "health": "/health",
    "ready": "/ready"
  }
}
```

### Upstream Demo Endpoints

- `GET /ping`
- `GET /resource`
- `GET /slow?ms=200`
- `GET /echo`
- `GET /health`

## Project Plan

The full, self-sufficient roadmap is documented in `PROJECT_PLAN.md`. It includes:

- Locked decisions and scope (reverse-proxy gateway, Postgres + Drizzle, Redis token bucket)
- Week-by-week milestones with acceptance criteria
- Local distributed demo plan (Compose + k6)
- Deployment checklist for DigitalOcean (Ubuntu 24)
- Failure modes and operational checklists

## Testing

The project uses Vitest. Unit tests are co-located with source files (`*.test.ts`) and integration tests live under `tests/integration`.

```bash
npm run test
npm run test:watch
```

## Tech Stack

- **Runtime:** Node.js (production targets Node 22 LTS)
- **Language:** TypeScript (strict mode)
- **Gateway:** Fastify + `@fastify/reply-from`
- **Testing:** Vitest
- **Validation:** Zod
- **Tooling:** Biome
- **Planned:** Postgres + Drizzle, Redis, Docker Compose, k6

## Resources

- https://youtu.be/MIJFyUPG4Z4
- https://bytebytego.com/courses/system-design-interview/design-a-rate-limiter

## License

MIT
