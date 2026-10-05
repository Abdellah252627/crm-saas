import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(
    new AppError(404, `Route ${req.method} ${req.originalUrl} does not exist`, "ROUTE_NOT_FOUND"),
  );
}

function formatZodIssues(error: ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

interface BodyParserError {
  status: number;
  type: string;
}

function isBodyParserError(error: unknown): error is BodyParserError {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const candidate = error as Partial<BodyParserError>;
  return (
    typeof candidate.type === "string" &&
    candidate.type.startsWith("entity.") &&
    typeof candidate.status === "number"
  );
}

function describeBodyParserError(type: string): { status: number; code: string; message: string } {
  if (type === "entity.parse.failed") {
    return { status: 400, code: "INVALID_JSON", message: "Request body is not valid JSON" };
  }
  if (type === "entity.too.large") {
    return { status: 413, code: "PAYLOAD_TOO_LARGE", message: "Request body exceeds the allowed size" };
  }
  return { status: 400, code: "INVALID_REQUEST_BODY", message: "Request body could not be processed" };
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (isBodyParserError(error)) {
    const described = describeBodyParserError(error.type);
    res.status(described.status).json({
      error: { code: described.code, message: described.message },
    });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: formatZodIssues(error),
      },
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const unavailableCodes = ["P1001", "P1002", "P1008", "P1010", "P1017"];
    if (unavailableCodes.includes(error.code)) {
      res.status(503).json({
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "The database is temporarily unavailable, please retry",
        },
      });
      return;
    }
    if (error.code === "P2002") {
      res.status(409).json({
        error: { code: "CONFLICT", message: "A record with these values already exists" },
      });
      return;
    }
    if (error.code === "P2025") {
      res.status(404).json({
        error: { code: "NOT_FOUND", message: "The requested record does not exist" },
      });
      return;
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      error: { code: "INVALID_QUERY", message: "The database query was malformed" },
    });
    return;
  }

  console.error("[unhandled]", error);

  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  });
}