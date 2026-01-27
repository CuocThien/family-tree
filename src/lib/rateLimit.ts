/**
 * Rate Limiting Utility
 *
 * Provides in-memory rate limiting using LRU cache.
 * Helps prevent brute force attacks on authentication endpoints.
 */

import { LRUCache } from 'lru-cache';

interface RateLimitOptions {
  interval: number; // milliseconds
  maxRequests: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt?: Date;
}

const rateLimiters = new Map<string, LRUCache<string, { count: number; resetAt: number }>>();

/**
 * Create a rate limiter for a specific endpoint.
 *
 * @param key - Unique identifier for this rate limiter
 * @param options - Rate limiting options
 * @returns Rate limiter with check method
 *
 * @example
 * ```ts
 * const loginRateLimit = rateLimit('login', {
 *   interval: 15 * 60 * 1000, // 15 minutes
 *   maxRequests: 5, // 5 attempts per 15 minutes
 * });
 *
 * const result = loginRateLimit.check(userIdentifier);
 * if (!result.success) {
 *   return { error: 'Too many attempts. Try again later.' };
 * }
 * ```
 */
export function rateLimit(key: string, options: RateLimitOptions) {
  let cache = rateLimiters.get(key);

  if (!cache) {
    cache = new LRUCache<string, { count: number; resetAt: number }>({
      max: 10000,
      ttl: options.interval,
    });
    rateLimiters.set(key, cache);
  }

  return {
    /**
     * Check if the identifier has exceeded the rate limit.
     *
     * @param identifier - Unique identifier (e.g., IP address, email)
     * @returns Rate limit result with success status and remaining requests
     */
    check: (identifier: string): RateLimitResult => {
      const now = Date.now();
      const current = cache!.get(identifier);

      if (!current || now > current.resetAt) {
        // First request or interval expired
        const resetAt = now + options.interval;
        cache!.set(identifier, { count: 1, resetAt });
        return {
          success: true,
          remaining: options.maxRequests - 1,
          resetAt: new Date(resetAt),
        };
      }

      if (current.count >= options.maxRequests) {
        // Rate limit exceeded
        return {
          success: false,
          remaining: 0,
          resetAt: new Date(current.resetAt),
        };
      }

      // Increment count
      current.count++;
      cache!.set(identifier, current);
      return {
        success: true,
        remaining: options.maxRequests - current.count,
        resetAt: new Date(current.resetAt),
      };
    },

    /**
     * Reset the rate limit for a specific identifier.
     *
     * @param identifier - Unique identifier to reset
     */
    reset: (identifier: string): void => {
      cache!.delete(identifier);
    },

    /**
     * Clear all rate limits for this endpoint.
     */
    clear: (): void => {
      cache!.clear();
    },
  };
}

/**
 * Pre-configured rate limiters for common endpoints.
 */
export const rateLimits = {
  /**
   * Login endpoint rate limiter.
   * 5 attempts per 15 minutes per identifier.
   */
  login: rateLimit('login', {
    interval: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  }),

  /**
   * Password reset endpoint rate limiter.
   * 3 requests per hour per identifier.
   */
  passwordReset: rateLimit('password-reset', {
    interval: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
  }),

  /**
   * Registration endpoint rate limiter.
   * 3 attempts per hour per IP address.
   */
  registration: rateLimit('registration', {
    interval: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
  }),

  /**
   * API endpoint rate limiter.
   * 100 requests per minute per user.
   */
  api: rateLimit('api', {
    interval: 60 * 1000, // 1 minute
    maxRequests: 100,
  }),
};

/**
 * Extract identifier from request for rate limiting.
 * Uses IP address from x-forwarded-for header or fallback to a default.
 *
 * @param request - Next.js request object
 * @returns Identifier string for rate limiting
 */
export function getRateLimitIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}
