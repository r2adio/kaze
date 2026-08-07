-- Distributed token bucket, executed atomically in Redis.
-- KEYS[1]: bucket key
-- ARGV[1]: capacity
-- ARGV[2]: refill rate (tokens per second)
-- ARGV[3]: now (epoch ms)
-- Returns { allowed, remaining, retry_after_ms }

local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
if rate <= 0 then
  rate = 1
end
local now = tonumber(ARGV[3])

local tokens = tonumber(redis.call('HGET', key, 'tokens') or tostring(capacity))
local last = tonumber(redis.call('HGET', key, 'last') or tostring(now))

local elapsed = (now - last) / 1000
tokens = math.min(capacity, tokens + elapsed * rate)

local allowed = 0
if tokens >= 1 then
  tokens = tokens - 1
  allowed = 1
end

redis.call('HSET', key, 'tokens', tokens, 'last', now)

local retry_after_ms = 0
if allowed == 0 then
  retry_after_ms = math.ceil(((1 - tokens) / rate) * 1000)
end

-- keep the key long enough to refill from empty to full
local ttl_ms = math.max(retry_after_ms, math.ceil((capacity / rate) * 1000))
redis.call('PEXPIRE', key, ttl_ms)

return { allowed, math.floor(tokens), retry_after_ms }
