import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../services/auth.service.js";
import { AppError } from "../utils/AppError.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

const BEARER_PREFIX = "Bearer ";

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith(BEARER_PREFIX)) {
      throw AppError.unauthorized("Missing Bearer access token");
    }
    const token = header.slice(BEARER_PREFIX.length).trim();
    if (!token) {
      throw AppError.unauthorized("Missing Bearer access token");
    }
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch (error) {
    next(error);
  }
}