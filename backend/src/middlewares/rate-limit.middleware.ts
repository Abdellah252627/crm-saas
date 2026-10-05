import rateLimit from "express-rate-limit";
import type { ClientRateLimitInfo, Store } from "express-rate-limit";
import type { Redis } from "@upstash/redis";
import type { Request, Response } from "express";
import { env } from "../config/env.js";

function handler(_req: Request, res: Response): void {
  res.status(429).json({
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests, please slow down and try again later",
    },
  });
}

/**
 * Fixed-window store backed by Upstash Redis for serverless deployments,
 * where every function invocation would otherwise get its own in-memory
 * counter. INCR bumps the hit count and PEXPIRE sets the window TTL on
 * the first hit of each window.
 */
class UpstashRateLimitStore implements Store {
  localKeys = false;
  prefix = "rl";

  constructor(
    private readonly redis: Redis,
    private readonly windowMs: number,
  ) {}

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const hits = await this.redis.eval(SCRIPT, [this.key(key)], [
      String(this.windowMs),
    ]);
    return { totalHits: Number(hits), resetTime: undefined };
  }

  async decrement(key: string): Promise<void> {
    await this.redis.decr(this.key(key));
  }

  async resetKey(key: string): Promise<void> {
    await this.redis.del(this.key(key));
  }

  async get(key: string): Promise<ClientRateLimitInfo | undefined> {
    const hits = await this.redis.get<number>(this.key(key));
    if (hits === null || hits === undefined) return undefined;
    return { totalHits: hits, resetTime: undefined };
  }

  private key(key: string): string {
    return `${this.prefix}:${key}`;
  }
}

const SCRIPT =
  "local hits = redis.call('INCR', KEYS[1]) " +
  "if hits == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end " +
  "return hits";

// One shared HTTP client; each limiter gets its own store instance so
// every window keeps its own TTL.
let redisClient: Redis | undefined;

if (env.upstashRedisUrl !== undefined && env.upstashRedisToken !== undefined) {
  const { Redis } = await import("@upstash/redis");
  redisClient = new Redis({
    url: env.upstashRedisUrl,
    token: env.upstashRedisToken,
  });
}

function build(limit: number, windowMs: number) {
  return rateLimit({
    standardHeaders: "draft-7",
    legacyHeaders: false,
    // The default key generator is IP based and already normalises IPv6, so no
    // custom keyGenerator is supplied here.
    skip: () => !env.rateLimitEnabled,
    handler,
    limit,
    windowMs,
    // Falls back to the built-in in-memory store for single-process hosts.
    ...(redisClient === undefined
      ? {}
      : { store: new UpstashRateLimitStore(redisClient, windowMs) }),
  });
}

/** Bounds credential stuffing and online password guessing. */
export const loginRateLimiter = build(env.loginRateLimit, 15 * 60 * 1000);

/** Bounds automated account creation. */
export const registerRateLimiter = build(env.registerRateLimit, 60 * 60 * 1000);

/** Broad backstop across the authenticated API surface. */
export const apiRateLimiter = build(env.apiRateLimit, 60 * 1000);
