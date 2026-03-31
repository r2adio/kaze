# Kaze

**A high-performance distributed rate limiting service**

Kaze (Japanese for "wind" 風) is a distributed rate limiter built with TypeScript and Bun. This project was inspired by the YouTube video ["Design a Distributed Rate Limiter w/ Ex-Meta Staff Engineer: System Design Breakdown"](https://youtu.be/MIJFyUPG4Z4) by Hello Interview - SWE Interview Preparation.

## 🎯 Project Status

**Current Phase:** Foundation Complete → Starting Phase 1  
**Completion:** ~15%

### What's Implemented ✓

- ✅ Token Bucket algorithm with comprehensive tests
- ✅ Basic HTTP server with health checks
- ✅ Clean project structure
- ✅ TypeScript with strict mode

### What's Next 🚧

- 🔨 Phase 1: Connect rate limiting to HTTP requests
- 🔜 Phase 2: Add persistence & observability
- 🔜 Phase 3: Redis integration (distributed mode)
- 🔜 Phase 4: Complete feature set (multiple algorithms, abuse detection)
- 🔜 Phase 5: Production hardening

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.3.11 or higher
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/r2adio/kaze
cd kaze

bun install # Install dependencies

cp .env.example .env # Copy environment configuration

bun test # Run tests

bun run dev # Start development server
```

The server will start on `http://localhost:3000`

### Available Scripts

```bash
bun run dev              # Start dev server with hot reload
bun run start            # Start production server
bun run build            # Build for production
bun test                 # Run all tests
bun test:watch           # Run tests in watch mode
bun test:unit            # Run unit tests only
bun test:integration     # Run integration tests only
```

## 📁 Project Structure

```
kaze/
├── src/
│   ├── domain/
│   │   ├── entities/          # Core domain entities
│   │   │   ├── token_bucket.ts
│   │   │   └── token_bucket.test.ts
│   │   ├── services/          # Domain services (Phase 1)
│   │   └── value_objects/     # Value objects (Phase 1)
│   ├── infrastructure/
│   │   └── config/            # Configuration management (Phase 1)
│   ├── middleware/            # HTTP middleware (Phase 1)
│   └── index.ts               # Server entry point
├── tests/
│   └── integration/           # Integration tests (Phase 1)
├── .env.example               # Environment variables template
├── package.json
└── README.md
```

## 🛠️ Tech Stack

- **Runtime:** [Bun](https://bun.sh/) - Fast JavaScript runtime
- **Language:** TypeScript 5.x with strict mode
- **Testing:** Bun's built-in test runner
- **Validation:** Zod (for configuration validation in Phase 1)
- **Future:** Redis (Phase 3), Docker (Phase 4)

## 📖 API Documentation

### Endpoints

#### `GET /health`

Health check endpoint

**Response:**

```json
{
  "status": "healthy",
  "service": "kaze",
  "version": "0.1.0",
  "timestamp": "2026-04-03T10:30:00.000Z"
}
```

#### `GET /`

Service information

**Response:**

```json
{
  "message": "Kaze - Distributed Rate Limiter",
  "version": "0.1.0",
  "documentation": "https://github.com/yourusername/kaze",
  "endpoints": {
    "health": "/health"
  }
}
```

## 🗺️ Development Roadmap

### Phase 1: Make It Work (MVP) 🔨 _In Progress_

- [ ] Create client identification system (IP, API key)
- [ ] Build RateLimiterService with bucket management
- [ ] Implement rate limiting middleware
- [ ] Add configuration system with Zod validation
- [ ] Return proper rate limit headers (X-RateLimit-\*)
- [ ] Integration tests

### Phase 2: Persistence & Observability

- [ ] Implement repository pattern
- [ ] In-memory repository implementation
- [ ] Add metrics and monitoring
- [ ] Enhanced logging
- [ ] Admin API endpoints

### Phase 3: Distributed Mode

- [ ] Redis integration
- [ ] Redis repository implementation
- [ ] Multi-instance coordination
- [ ] Docker Compose setup
- [ ] Load balancer configuration

### Phase 4: Complete Features

- [ ] Sliding window algorithm
- [ ] Fixed window algorithm
- [ ] Leaky bucket algorithm
- [ ] Abuse detection
- [ ] Per-endpoint rate limits
- [ ] Tiered limits (free/premium)

### Phase 5: Production Ready

- [ ] API key authentication
- [ ] Security hardening
- [ ] Kubernetes manifests
- [ ] CI/CD pipeline
- [ ] Performance benchmarks
- [ ] Comprehensive documentation

## 🧪 Testing

The project uses Bun's built-in test runner. Tests are co-located with source files (`*.test.ts`).

```bash
bun test # Run all tests

bun test --coverage # Run with coverage

bun test --watch # Watch mode
```

## 📚 Resources

- [YouTube: Design a Distributed Rate Limiter](https://youtu.be/MIJFyUPG4Z4) - Original inspiration
- [Rate-limiting strategies and techniques](https://bytebytego.com/courses/system-design-interview/design-a-rate-limiter) - ByteByteGo

## 🤝 Contributing

This is a learning project, but contributions are welcome! Feel free to open issues or submit PRs.

## 📝 License

MIT

## 🔗 Links

- GitHub: [https://github.com/r2adio/kaze]
- YouTube Video: https://youtu.be/MIJFyUPG4Z4
