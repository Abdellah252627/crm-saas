// Plain-node harness: no tsx loader involved, so this isolates whether the
// odd server.listening / ERR_SERVER_NOT_RUNNING behaviour comes from the loader
// or from the shutdown code itself.
const mod = await import("../../dist/index.js");
const server = mod.server;

setTimeout(() => {
  console.log(`[test] listening after 400ms = ${server?.listening}`);
  fetch("http://localhost:4000/health")
    .then((r) => console.log(`[test] GET /health -> ${r.status}`))
    .catch((e) => console.log(`[test] GET /health FAILED: ${e.message}`))
    .finally(() => {
      console.log("[test] emitting SIGTERM on self");
      process.emit("SIGTERM");
    });
}, 400);

const watchdog = setTimeout(() => {
  console.error("[test] FAIL: still alive 5s after SIGTERM");
  process.exit(1);
}, 5000);
watchdog.unref();