import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import * as helmetModule from "helmet";
import type { NextFunction, Request, Response } from "express";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { apiRateLimiter } from "./middlewares/rate-limit.middleware.js";
import { prisma } from "./prisma/client.js";
import authRoutes from "./routes/auth.routes.js";
import clientRoutes from "./routes/client.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import pipelineRoutes from "./routes/pipeline.routes.js";
import { pruneExpiredSessions } from "./services/auth.service.js";

// helmet 8 exports its middleware only as the ESM/CJS `default` export.
// Reading `.default` off the namespace keeps the call valid under every
// TypeScript resolution mode, where a plain default import can bind to
// the non-callable module namespace instead of the middleware function.
const helmet = helmetModule.default;

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use("/api/auth", authRoutes);
app.use("/api/clients", apiRateLimiter, clientRoutes);
app.use("/api/pipeline", apiRateLimiter, pipelineRoutes);
app.use("/api/dashboard", apiRateLimiter, dashboardRoutes);

// Called by the Vercel Cron job defined in vercel.json; on classic hosts the
// setInterval below handles pruning instead.
app.all("/api/internal/prune", requireCronSecret, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const pruned = await pruneExpiredSessions();
    res.json({ pruned });
  } catch (error) {
    next(error);
  }
});

function requireCronSecret(req: Request, res: Response, next: NextFunction): void {
  const authorization = req.headers.authorization;
  if (env.cronSecret === "" || authorization !== `Bearer ${env.cronSecret}`) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Invalid cron secret" },
    });
    return;
  }
  next();
}

app.use(notFoundHandler);
app.use(errorHandler);

let server: ReturnType<typeof app.listen> | undefined;
let pruneTimer: ReturnType<typeof setInterval> | undefined;
let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[shutdown] ${signal} received, closing server`);

  if (pruneTimer !== undefined) {
    clearInterval(pruneTimer);
  }

  // Backstop only: it does not hold the event loop open, but still fires if a
  // lingering keep-alive connection prevents the server from closing in time.
  const forcedExit = setTimeout(() => {
    console.error("[shutdown] timed out, forcing exit");
    process.exit(1);
  }, 10_000);
  forcedExit.unref();

  try {
    await new Promise<void>((resolve) => {
      if (server === undefined) {
        resolve();
        return;
      }
      server.close((error) => {
        if (error) console.error("[shutdown] server.close failed", error);
        resolve();
      });
    });

    await prisma.$disconnect();
    clearTimeout(forcedExit);
    console.log("[shutdown] complete");
    // No explicit process.exit() here on purpose: forcing an exit while libuv
    // handles are still closing trips a UV_HANDLE_CLOSING assertion on Windows.
    // Once the server and Prisma are closed the event loop drains on its own.
  } catch (error) {
    console.error("[shutdown] failed", error);
    process.exitCode = 1;
    clearTimeout(forcedExit);
  }
}

// Serverless runtimes (Vercel) import the app without starting a listener:
// api/index.ts exports the handler instead, and vercel.json schedules the
// session pruning cron.
if (!env.isServerless) {
  server = app.listen(env.port, () => {
    console.log(`crm-saas-backend listening on http://localhost:${env.port}`);
  });

  const SESSION_PRUNE_INTERVAL_MS = 60 * 60 * 1000;
  pruneTimer = setInterval(() => {
    void pruneExpiredSessions().catch((error: unknown) => {
      console.error("[session-prune] failed", error);
    });
  }, SESSION_PRUNE_INTERVAL_MS);
  pruneTimer.unref();

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      void shutdown(signal);
    });
  }
}

export default app;
export { server };
