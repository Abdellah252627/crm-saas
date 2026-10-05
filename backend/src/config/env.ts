import "dotenv/config";

export type NodeEnv = "development" | "production" | "test";

export interface AppEnv {
  nodeEnv: NodeEnv;
  isProduction: boolean;
  port: number;
  databaseUrl: string;
  directUrl?: string;
  jwtSecret: string;
  accessTokenTtl: string;
  refreshTokenTtlMs: number;
  corsOrigins: string[];
  rateLimitEnabled: boolean;
  loginRateLimit: number;
  registerRateLimit: number;
  apiRateLimit: number;
}

export class EnvValidationError extends Error {
  readonly problems: string[];

  constructor(problems: string[]) {
    super(`Invalid environment configuration:\n  - ${problems.join("\n  - ")}`);
    this.name = "EnvValidationError";
    this.problems = problems;
  }
}

const MIN_SECRET_LENGTH = 32;
const SECRET_PLACEHOLDER_PREFIX = "change_me";
const DEFAULT_PORT = 4000;
const DEFAULT_CORS_ORIGIN = "http://localhost:5173";
const DEFAULT_REFRESH_TTL_DAYS = 7;

const TTL_UNIT_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
};

const DEFAULT_LOGIN_RATE_LIMIT = 30;
const DEFAULT_REGISTER_RATE_LIMIT = 20;
const DEFAULT_API_RATE_LIMIT = 600;

function parseTtlToMs(raw: string | undefined, fallback: number): number | null {
  if (raw === undefined || raw.trim() === "") return fallback;
  const match = /^(\d+)\s*(ms|s|m|h|d|w)?$/i.exec(raw.trim());
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = (match[2] ?? "m").toLowerCase();
  return amount * (TTL_UNIT_MS[unit] ?? 60_000);
}

/**
 * Accepts either a raw duration ("15m", "7d") or a bare number of minutes ("15"),
 * which is the shape used in the checked-in .env. Returns a value jsonwebtoken accepts.
 */
function normalizeAccessTtl(raw: string | undefined, problems: string[]): string {
  if (raw === undefined || raw.trim() === "") return "15m";
  const value = raw.trim();
  if (/^\d+$/.test(value)) return `${value}m`;
  if (parseTtlToMs(value, 0) === null) {
    problems.push(`JWT_EXPIRES_IN must be a duration like "15m"/"7d" or a number of minutes, got "${value}"`);
  }
  return value;
}

function requireString(
  raw: string | undefined,
  name: string,
  problems: string[],
): string {
  if (raw === undefined || raw.trim() === "") {
    problems.push(`${name} is required but was not set`);
    return "";
  }
  return raw.trim();
}

function parseBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = raw.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(value)) return true;
  if (["0", "false", "no", "off"].includes(value)) return false;
  return fallback;
}

function parsePositiveInt(
  raw: string | undefined,
  fallback: number,
  name: string,
  problems: string[],
): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number(raw.trim());
  if (!Number.isInteger(parsed) || parsed < 1) {
    problems.push(`${name} must be a positive integer, got "${raw.trim()}"`);
    return fallback;
  }
  return parsed;
}

function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const problems: string[] = [];

  const rawNodeEnv = (source.NODE_ENV ?? "development").trim();
  const nodeEnv: NodeEnv =
    rawNodeEnv === "production" || rawNodeEnv === "test" ? rawNodeEnv : "development";
  if (!["development", "production", "test"].includes(rawNodeEnv)) {
    problems.push(`NODE_ENV must be development, production or test, got "${rawNodeEnv}"`);
  }

  const rawPort = (source.PORT ?? "").trim();
  let port = DEFAULT_PORT;
  if (rawPort === "") {
    problems.push("PORT is required but was not set");
  } else {
    const parsed = Number(rawPort);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65_535) {
      problems.push(`PORT must be an integer between 1 and 65535, got "${rawPort}"`);
    } else {
      port = parsed;
    }
  }

  const databaseUrl = requireString(source.DATABASE_URL, "DATABASE_URL", problems);
  if (databaseUrl !== "" && !/^postgres(ql)?:\/\//.test(databaseUrl)) {
    problems.push("DATABASE_URL must be a postgres:// or postgresql:// connection string");
  }

  const jwtSecret = requireString(source.JWT_SECRET, "JWT_SECRET", problems);
  if (jwtSecret !== "") {
    if (jwtSecret.startsWith(SECRET_PLACEHOLDER_PREFIX)) {
      problems.push("JWT_SECRET is still set to its placeholder value");
    } else if (jwtSecret.length < MIN_SECRET_LENGTH) {
      problems.push(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters`);
    }
  }

  const accessTokenTtl = normalizeAccessTtl(source.JWT_EXPIRES_IN, problems);
  const refreshTokenTtlMs =
    parseTtlToMs(source.REFRESH_EXPIRES_IN, DEFAULT_REFRESH_TTL_DAYS * TTL_UNIT_MS.d!) ??
    DEFAULT_REFRESH_TTL_DAYS * TTL_UNIT_MS.d!;

  const corsOrigins = (source.CORS_ORIGIN ?? DEFAULT_CORS_ORIGIN)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const rateLimitEnabled = parseBoolean(source.RATE_LIMIT_ENABLED, true);
  const loginRateLimit = parsePositiveInt(
    source.LOGIN_RATE_LIMIT,
    DEFAULT_LOGIN_RATE_LIMIT,
    "LOGIN_RATE_LIMIT",
    problems,
  );
  const registerRateLimit = parsePositiveInt(
    source.REGISTER_RATE_LIMIT,
    DEFAULT_REGISTER_RATE_LIMIT,
    "REGISTER_RATE_LIMIT",
    problems,
  );
  const apiRateLimit = parsePositiveInt(
    source.API_RATE_LIMIT,
    DEFAULT_API_RATE_LIMIT,
    "API_RATE_LIMIT",
    problems,
  );

  if (problems.length > 0) {
    throw new EnvValidationError(problems);
  }

  return Object.freeze({
    nodeEnv,
    isProduction: nodeEnv === "production",
    port,
    databaseUrl,
    directUrl: source.DIRECT_URL?.trim() || undefined,
    jwtSecret,
    accessTokenTtl,
    refreshTokenTtlMs,
    corsOrigins,
    rateLimitEnabled,
    loginRateLimit,
    registerRateLimit,
    apiRateLimit,
  });
}

export const env: AppEnv = loadEnv();

export { loadEnv };