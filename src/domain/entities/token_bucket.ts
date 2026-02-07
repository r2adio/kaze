/* TOKEN BUCKET Algorithm:
 * - create bucket with fix capacity and fill rate
 * - when request comes, check if bucket has enough tokens
 * - if enough tokens, allow request and remove tokens from bucket
 * - if not enough tokens, reject request
 * - bucket refills at a constant rate until it reaches capacity
 * - this algorithm allows for bursts of traffic while still enforcing a steady rate of requests
 */
export class TokenBucket {
  constructor(
    private capacity: number,
    private fillRate: number,
    private tokens = capacity,
    private lastRefill = Date.now(),
  ) {}

  // refill tokens based on elapsed time, since last refill
  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(
      // don't exceed capacity
      this.capacity,
      this.tokens + elapsed * this.fillRate,
    );
    this.lastRefill = now;
  }

  // returns true if request is allowed, false if rejected
  allow(): boolean {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  // return current token count (for testing purposes)
  getTokens(): number {
    this.refill();
    return this.tokens;
  }
}
