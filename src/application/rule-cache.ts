import type { FastifyBaseLogger } from "fastify";
import type { RateLimitRule } from "../domain/rate-limit/entities.ts";
import { listEnabledRules } from "../infrastructure/db/rule-repository.ts";

export interface RuleCacheStatus {
	ready: boolean;
	ruleCount: number;
	lastRefreshAt: Date | null;
	lastError: string | null;
}

// In-memory snapshot of enabled rules, periodically refreshed from
// Postgres. Refresh failures keep the last known good snapshot so the
// request path never depends on a live query (fail-open).
export class RuleCache {
	private readonly refreshMs: number;
	private readonly log: FastifyBaseLogger;
	private rules: RateLimitRule[] = [];
	private lastRefreshAt: Date | null = null;
	private lastError: string | null = null;
	private timer: NodeJS.Timeout | null = null;

	constructor(refreshMs: number, log: FastifyBaseLogger) {
		this.refreshMs = refreshMs;
		this.log = log;
	}

	async refresh(): Promise<void> {
		try {
			this.rules = await listEnabledRules();
			this.lastRefreshAt = new Date();
			this.lastError = null;
		} catch (err) {
			this.lastError = err instanceof Error ? err.message : String(err);
			this.log.warn({ err }, "failed to refresh rate-limit rules; keeping last known snapshot");
		}
	}

	get(): readonly RateLimitRule[] {
		return this.rules;
	}

	status(): RuleCacheStatus {
		return {
			ready: this.lastRefreshAt !== null,
			ruleCount: this.rules.length,
			lastRefreshAt: this.lastRefreshAt,
			lastError: this.lastError,
		};
	}

	start(): void {
		this.timer = setInterval(() => {
			void this.refresh();
		}, this.refreshMs);
		this.timer.unref();
	}

	async stop(): Promise<void> {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
	}
}
