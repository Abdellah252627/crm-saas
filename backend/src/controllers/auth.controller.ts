import type { CookieOptions, Request, Response } from "express";
import {
  REFRESH_TOKEN_MAX_AGE_MS,
  createSession,
  login,
  register,
  revokeSession,
  rotateSession,
} from "../services/auth.service.js";
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";

const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_PATH = "/api/auth";

function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "strict",
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  };
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions());
}

function requireRefreshCookie(req: Request): string {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (typeof token !== "string" || token === "") {
    throw AppError.unauthorized("Refresh token cookie is missing");
  }
  return token;
}

export async function registerController(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body as { name: string; email: string; password: string };
  const user = await register({ name, email, password });
  const { accessToken, refreshToken } = await createSession(user);
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ accessToken, user });
}

export async function loginController(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };
  const { user, tokens } = await login({ email, password });
  setRefreshCookie(res, tokens.refreshToken);
  res.status(200).json({ accessToken: tokens.accessToken, user });
}

export async function refreshController(req: Request, res: Response): Promise<void> {
  const { accessToken, refreshToken } = await rotateSession(requireRefreshCookie(req));
  setRefreshCookie(res, refreshToken);
  res.status(200).json({ accessToken });
}

export async function logoutController(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (typeof token === "string" && token !== "") {
    await revokeSession(token);
  }
  const { maxAge: _maxAge, ...options } = refreshCookieOptions();
  res.clearCookie(REFRESH_COOKIE_NAME, options);
  res.status(204).send();
}