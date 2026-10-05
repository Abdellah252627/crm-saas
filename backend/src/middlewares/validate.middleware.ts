import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

export type ValidationTarget = "body" | "query" | "params";

export function validate(schema: ZodTypeAny, target: ValidationTarget = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      next(result.error);
      return;
    }
    Object.defineProperty(req, target, {
      value: result.data,
      writable: true,
      configurable: true,
    });
    next();
  };
}