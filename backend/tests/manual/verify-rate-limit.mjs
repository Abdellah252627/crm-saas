const BASE = "http://localhost:4000";
const email = `rl.${Date.now()}@example.com`;

await fetch(`${BASE}/api/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "RL User", email, password: "SuperSecret123" }),
});

console.log("=== POST /api/auth/login (limit 5 / 15min) ===");
let firstBlock = null;
for (let i = 1; i <= 8; i++) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "SuperSecret123" }),
  });
  const retryAfter = res.headers.get("retry-after");
  const ratelimit = res.headers.get("ratelimit");
  if (res.status === 429 && firstBlock === null) firstBlock = i;
  console.log(
    `  attempt ${i} -> ${res.status}${retryAfter ? ` retry-after=${retryAfter}` : ""}` +
      `${ratelimit && res.status === 429 ? ` ${ratelimit}` : ""}`,
  );
}
console.log(`  first 429 at attempt: ${firstBlock} (expect 6, the limit is 5)`);

const login = await fetch(`${BASE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password: "SuperSecret123" }),
});
const token = (await login.json()).accessToken;
console.log(`\n  (kept a spare token from attempt ${firstBlock === null ? "n/a" : "8 - all blocked"}, testing API limiter separately)`);

console.log("\n=== GET /api/clients (API limit 8 / min) ===");
for (let i = 1; i <= 10; i++) {
  const res = await fetch(`${BASE}/api/clients`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  let code = "";
  if (res.status === 429) {
    code = ` ${res.headers.get("ratelimit") ?? ""}`;
    const body = await res.json();
    console.log(`  request ${i} -> ${res.status}${code} body=${JSON.stringify(body.error)}`);
  } else {
    console.log(`  request ${i} -> ${res.status}`);
  }
}