import type { Request } from "express";
import { AppError } from "./AppError.js";

export function requireUserId(req: Request): string {
  if (!req.userId) {
    throw AppError.unauthorized();
  }
  return req.userId;
}

export function requireStringParam(req: Request, name: string): string {
  const value = (req.params as Record<string, unknown>)[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw AppError.badRequest(`Missing or invalid route parameter: ${name}`);
  }
  return value;
}