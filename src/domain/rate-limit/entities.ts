export type RuleAlgorithm = "token_bucket";

export type ClientSelectorType = "api_key" | "ip" | "all";

export interface RateLimitRule {
	id: string;
	name: string;
	enabled: boolean;
	priority: number;
	algorithm: RuleAlgorithm;
	capacity: number;
	refillRatePerSec: number;
	matchMethod: string | null;
	matchPathPattern: string | null;
	clientSelectorType: ClientSelectorType;
	clientSelectorValue: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface ClientIdentity {
	apiKey: string | null;
	ip: string | null;
	/** normalized identity used as the per-client key in Redis */
	id: string;
}
