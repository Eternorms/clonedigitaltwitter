/**
 * Simple in-memory rate limiter for Supabase Edge Functions
 * Uses a sliding window approach with automatic cleanup
 *
 * Note: This is per-instance rate limiting. For distributed rate limiting,
 * consider using Supabase's Redis or a dedicated rate limiting service.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (per edge function instance)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return

  lastCleanup = now
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number
  /** Time window in seconds */
  windowSeconds: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfter?: number
}

/**
 * Check if a request should be rate limited
 * @param key Unique identifier (e.g., user ID, IP address)
 * @param config Rate limit configuration
 * @returns RateLimitResult with allowed status and metadata
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  cleanup()

  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const entry = rateLimitStore.get(key)

  // No existing entry or window expired - allow and create new entry
  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs
    rateLimitStore.set(key, { count: 1, resetAt })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
    }
  }

  // Window still active - check count
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  // Increment count and allow
  entry.count++
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Create a rate limit response with proper headers
 */
export function rateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      retryAfter: result.retryAfter,
      message: `Too many requests. Please try again in ${result.retryAfter} seconds.`,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.resetAt.toString(),
        'Retry-After': result.retryAfter?.toString() ?? '60',
      },
    }
  )
}

/**
 * Add rate limit headers to a successful response
 */
export function addRateLimitHeaders(
  headers: Record<string, string>,
  result: RateLimitResult
): Record<string, string> {
  return {
    ...headers,
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
  }
}

// Default rate limit configs for different operations
export const RATE_LIMITS = {
  // AI generation: 10 requests per minute per user
  generatePost: { maxRequests: 10, windowSeconds: 60 },
  // Publishing: 30 tweets per 15 minutes per user (Twitter's limit is 50)
  publishPost: { maxRequests: 30, windowSeconds: 900 },
  // RSS sync: 20 syncs per minute per user
  syncRss: { maxRequests: 20, windowSeconds: 60 },
  // Telegram: 30 commands per minute per chat
  telegram: { maxRequests: 30, windowSeconds: 60 },
  // Tweet fetching: 5 requests per hour per user
  fetchTweets: { maxRequests: 5, windowSeconds: 3600 },
}
