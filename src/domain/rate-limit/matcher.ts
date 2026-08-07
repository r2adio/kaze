import type { ClientIdentity, RateLimitRule } from "./entities.ts";

export interface RuleMatchContext {
	method: string;
	path: string;
	identity: ClientIdentity;
}

// Selects the single rule that applies to a request: highest priority wins,
// then most specific path pattern, then id (deterministic tie-break).
export function findApplicableRule(
	rules: readonly RateLimitRule[],
	ctx: RuleMatchContext,
): RateLimitRule | undefined {
	const candidates = rules.filter(
		(rule) =>
			rule.enabled &&
			(!rule.matchMethod || rule.matchMethod === ctx.method) &&
			(!rule.matchPathPattern || pathMatches(rule.matchPathPattern, ctx.path)) &&
			clientApplies(rule, ctx.identity),
	);
	if (candidates.length === 0) return undefined;

	candidates.sort(
		(a, b) =>
			b.priority - a.priority ||
			pathSpecificity(b) - pathSpecificity(a) ||
			a.id.localeCompare(b.id),
	);
	return candidates[0];
}

function pathMatches(pattern: string, path: string): boolean {
	if (pattern.endsWith("*")) return path.startsWith(pattern.slice(0, -1));
	return path === pattern;
}

function pathSpecificity(rule: RateLimitRule): number {
	return rule.matchPathPattern?.length ?? 0;
}

function clientApplies(rule: RateLimitRule, identity: ClientIdentity): boolean {
	switch (rule.clientSelectorType) {
		case "all":
			return true;
		case "api_key":
			return (
				identity.apiKey !== null &&
				(rule.clientSelectorValue === null || rule.clientSelectorValue === identity.apiKey)
			);
		case "ip":
			return (
				identity.ip !== null &&
				(rule.clientSelectorValue === null || rule.clientSelectorValue === identity.ip)
			);
	}
}
