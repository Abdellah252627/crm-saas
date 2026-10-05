import type { Request, Response } from "express";
import app from "../src/index.js";

/**
 * Vercel Serverless Function entrypoint. The Vercel Node.js runtime
 * passes native Node request/response objects, which Express accepts
 * directly, so the whole app (middleware, routes, error handling)
 * runs unchanged behind the rewrites in vercel.json.
 */
export default function handler(req: Request, res: Response): void {
  app(req, res);
}
