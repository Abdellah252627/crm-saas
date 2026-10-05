import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EnvValidationError, loadEnv } from "../src/config/env.js";

const VALID: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  PORT: "4000",
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
  JWT_SECRET: "a".repeat(48),
  JWT_EXPIRES_IN: "15m",
};

function envWith(overrides: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return { ...VALID, ...overrides };
}

function problemsFor(overrides: NodeJS.ProcessEnv): string[] {
  try {
    loadEnv(overrides);
  } catch (error) {
    assert.ok(error instanceof EnvValidationError, "expected EnvValidationError");
    return error.problems;
  }
  assert.fail("expected loadEnv to throw");
}

describe("loadEnv", () => {
  it("accepts a minimal valid configuration", () => {
    const env = loadEnv(VALID);
    assert.equal(env.port, 4000);
    assert.equal(env.nodeEnv, "test");
    assert.equal(env.isProduction, false);
    assert.equal(env.accessTokenTtl, "15m");
  });

  it("treats a bare number as minutes for JWT_EXPIRES_IN", () => {
    assert.equal(loadEnv(envWith({ JWT_EXPIRES_IN: "30" })).accessTokenTtl, "30m");
  });

  it("flags a missing DATABASE_URL", () => {
    const problems = problemsFor(envWith({ DATABASE_URL: undefined }));
    assert.ok(problems.some((p) => p.includes("DATABASE_URL is required")));
  });

  it("rejects a non-postgres DATABASE_URL", () => {
    const problems = problemsFor(envWith({ DATABASE_URL: "mysql://localhost/db" }));
    assert.ok(problems.some((p) => p.includes("postgres://")));
  });

  it("rejects a placeholder JWT_SECRET", () => {
    const problems = problemsFor(envWith({ JWT_SECRET: "change_me_to_a_real_secret_value_long_enough" }));
    assert.ok(problems.some((p) => p.includes("placeholder")));
  });

  it("rejects a too-short JWT_SECRET", () => {
    const problems = problemsFor(envWith({ JWT_SECRET: "short" }));
    assert.ok(problems.some((p) => p.includes("at least 32 characters")));
  });

  it("rejects an out-of-range PORT", () => {
    const problems = problemsFor(envWith({ PORT: "70000" }));
    assert.ok(problems.some((p) => p.includes("PORT")));
  });

  it("rejects a malformed JWT_EXPIRES_IN", () => {
    const problems = problemsFor(envWith({ JWT_EXPIRES_IN: "soon" }));
    assert.ok(problems.some((p) => p.includes("JWT_EXPIRES_IN")));
  });

  it("rejects a non-positive rate limit", () => {
    const problems = problemsFor(envWith({ LOGIN_RATE_LIMIT: "0" }));
    assert.ok(problems.some((p) => p.includes("LOGIN_RATE_LIMIT")));
  });

  it("reports every problem at once instead of failing on the first", () => {
    const problems = problemsFor({ NODE_ENV: "staging", PORT: "abc", JWT_SECRET: "change_me" });
    assert.ok(problems.length >= 3, `expected several problems, got ${problems.length}`);
  });

  it("parses CORS_ORIGIN as a comma separated list", () => {
    const env = loadEnv(envWith({ CORS_ORIGIN: "http://a.test, http://b.test ," }));
    assert.deepEqual(env.corsOrigins, ["http://a.test", "http://b.test"]);
  });

  it("defaults rate limiting to enabled and honours an explicit opt-out", () => {
    assert.equal(loadEnv(VALID).rateLimitEnabled, true);
    assert.equal(loadEnv(envWith({ RATE_LIMIT_ENABLED: "false" })).rateLimitEnabled, false);
  });

  it("requires CRON_SECRET but not PORT in serverless mode", () => {
    const problems = problemsFor({ ...VALID, PORT: undefined, VERCEL: "1" });
    assert.ok(problems.some((p) => p.includes("CRON_SECRET")));
    assert.ok(!problems.some((p) => p.includes("PORT")));
  });

  it("accepts a serverless configuration with a cron secret", () => {
    const serverless = loadEnv(
      envWith({ PORT: undefined, VERCEL: "1", CRON_SECRET: "cron-secret-12345" }),
    );
    assert.equal(serverless.isServerless, true);
    assert.equal(serverless.port, 4000);
    assert.equal(serverless.cronSecret, "cron-secret-12345");
  });

  it("rejects a half-configured Upstash Redis pair", () => {
    const problems = problemsFor(
      envWith({ UPSTASH_REDIS_REST_URL: "https://redis.upstash.io" }),
    );
    assert.ok(problems.some((p) => p.includes("UPSTASH")));
  });

  it("accepts a complete Upstash Redis pair", () => {
    const withRedis = loadEnv(
      envWith({
        UPSTASH_REDIS_REST_URL: "https://redis.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "token",
      }),
    );
    assert.equal(withRedis.upstashRedisUrl, "https://redis.upstash.io");
    assert.equal(withRedis.upstashRedisToken, "token");
  });
});