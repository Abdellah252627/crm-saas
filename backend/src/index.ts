import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { apiRateLimiter } from "./middlewares/rate-limit.middleware.js";
import { prisma } from "./prisma/client.js";
import authRoutes from "./routes/auth.routes.js";
import clientRoutes from "./routes/client.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import pipelineRoutes from "./routes/pipeline.routes.js";
import { pruneExpiredSessions } from "./services/auth.service.js";

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

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(env.port, () => {
  console.log(`crm-saas-backend listening on http://localhost:${env.port}`);
});

const SESSION_PRUNE_INTERVAL_MS = 60 * 60 * 1000;
const pruneTimer = setInterval(() => {
  void pruneExpiredSessions().catch((error: unknown) => {
    console.error("[session-prune] failed", error);
  });
}, SESSION_PRUNE_INTERVAL_MS);
pruneTimer.unref();

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[shutdown] ${signal} received, closing server`);

  clearInterval(pruneTimer);

  // Backstop only: it does not hold the event loop open, but still fires if a
  // lingering keep-alive connection prevents the server from closing in time.
  const forcedExit = setTimeout(() => {
    console.error("[shutdown] timed out, forcing exit");
    process.exit(1);
  }, 10_000);
  forcedExit.unref();

  try {
    await new Promise<void>((resolve) => {
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

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void shutdown(signal);
  });
}

export default app;
export { server };