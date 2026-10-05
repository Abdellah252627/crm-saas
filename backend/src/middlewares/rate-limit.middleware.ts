import rateLimit from "express-rate-limit";
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
  });
}

/** Bounds credential stuffing and online password guessing. */
export const loginRateLimiter = build(env.loginRateLimit, 15 * 60 * 1000);

/** Bounds automated account creation. */
export const registerRateLimiter = build(env.registerRateLimit, 60 * 60 * 1000);

/** Broad backstop across the authenticated API surface. */
export const apiRateLimiter = build(env.apiRateLimit, 60 * 1000);