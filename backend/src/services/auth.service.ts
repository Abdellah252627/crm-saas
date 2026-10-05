import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/AppError.js";

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_BYTES = 48;
export const REFRESH_TOKEN_MAX_AGE_MS = env.refreshTokenTtlMs;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
}

interface TokenPayload {
  sub: string;
  email: string;
}

interface TokenUser {
  id: string;
  email: string;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

function signAccessToken(user: TokenUser): string {
  const payload: TokenPayload = { sub: user.id, email: user.email };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.accessTokenTtl as SignOptions["expiresIn"] });
}

function verifyAccessTokenOrThrow(token: string): TokenPayload {
  let decoded: unknown;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch {
    throw AppError.unauthorized("Invalid or expired token");
  }
  if (typeof decoded !== "object" || decoded === null) {
    throw AppError.unauthorized("Invalid token payload");
  }
  const { sub, email } = decoded as Partial<TokenPayload>;
  if (typeof sub !== "string" || typeof email !== "string") {
    throw AppError.unauthorized("Malformed token payload");
  }
  return { sub, email };
}

function hashRefreshToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function generateRefreshToken(): string {
  return randomBytes(REFRESH_TOKEN_BYTES).toString("base64url");
}

function refreshExpiry(): Date {
  return new Date(Date.now() + env.refreshTokenTtlMs);
}

export function toPublicUser(user: { id: string; name: string; email: string }): PublicUser {
  return { id: user.id, name: user.name, email: user.email };
}

export function verifyAccessToken(token: string): TokenPayload {
  return verifyAccessTokenOrThrow(token);
}

export async function createSession(user: TokenUser): Promise<IssuedTokens> {
  const refreshToken = generateRefreshToken();
  await prisma.refreshSession.create({
    data: { tokenHash: hashRefreshToken(refreshToken), userId: user.id, expiresAt: refreshExpiry() },
  });
  return { accessToken: signAccessToken(user), refreshToken };
}

/**
 * Swaps a live refresh token for a new pair. Presenting an already-revoked token is
 * treated as theft: every session for that user is revoked rather than just the one.
 */
export async function rotateSession(rawToken: string): Promise<IssuedTokens> {
  const session = await prisma.refreshSession.findUnique({
    where: { tokenHash: hashRefreshToken(rawToken) },
    select: { id: true, userId: true, expiresAt: true, revokedAt: true, user: { select: { id: true, email: true } } },
  });

  if (!session) {
    throw AppError.unauthorized("Invalid refresh token");
  }

  if (session.revokedAt !== null) {
    await revokeAllSessions(session.userId);
    throw AppError.unauthorized("Refresh token has already been used");
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    throw AppError.unauthorized("Refresh token expired");
  }

  const nextRefreshToken = generateRefreshToken();
  const expiresAt = refreshExpiry();
  await prisma.$transaction([
    prisma.refreshSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } }),
    prisma.refreshSession.create({
      data: { tokenHash: hashRefreshToken(nextRefreshToken), userId: session.userId, expiresAt },
    }),
  ]);

  return { accessToken: signAccessToken(session.user), refreshToken: nextRefreshToken };
}

export async function revokeSession(rawToken: string): Promise<void> {
  await prisma.refreshSession.updateMany({
    where: { tokenHash: hashRefreshToken(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.refreshSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Housekeeping for expired/revoked rows; safe to call on a timer. */
export async function pruneExpiredSessions(): Promise<number> {
  const cutoff = new Date(Date.now() - REFRESH_TOKEN_MAX_AGE_MS);
  const result = await prisma.refreshSession.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { lt: cutoff } }],
    },
  });
  return result.count;
}

export async function register(input: { name: string; email: string; password: string }): Promise<PublicUser> {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    throw AppError.conflict("An account with this email already exists");
  }
  const password = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { name: input.name.trim(), email, password },
    select: { id: true, name: true, email: true },
  });
  return toPublicUser(user);
}

export async function login(input: { email: string; password: string }): Promise<{
  user: PublicUser;
  tokens: IssuedTokens;
}> {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw AppError.unauthorized("Invalid email or password");
  }
  const passwordMatches = await bcrypt.compare(input.password, user.password);
  if (!passwordMatches) {
    throw AppError.unauthorized("Invalid email or password");
  }
  const tokens = await createSession(user);
  return { user: toPublicUser(user), tokens };
}