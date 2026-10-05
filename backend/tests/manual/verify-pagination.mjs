const BASE = "http://localhost:4000";

async function api(path, token, init = {}) {
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* empty */
  }
  return { status: res.status, json, headers: res.headers };
}

const email = `page.${Date.now()}@example.com`;
await api("/api/auth/register", null, {
  method: "POST",
  body: JSON.stringify({ name: "Page User", email, password: "SuperSecret123" }),
});
const login = await api("/api/auth/login", null, {
  method: "POST",
  body: JSON.stringify({ email, password: "SuperSecret123" }),
});
const token = login.json.accessToken;

const created = [];
for (let i = 0; i < 5; i++) {
  const r = await api("/api/clients", token, {
    method: "POST",
    body: JSON.stringify({ name: `Paged Client ${i}` }),
  });
  created.push(r.json.client.id);
}

const all = await api("/api/clients", token);
console.log("=== default (no pagination params) ===");
console.log(`  count=${all.json.count} total=${all.json.total} page=${all.json.page} limit=${all.json.limit} totalPages=${all.json.totalPages}`);

const p1 = await api("/api/clients?limit=2&page=1", token);
const p2 = await api("/api/clients?limit=2&page=2", token);
const p3 = await api("/api/clients?limit=2&page=3", token);
console.log("=== limit=2 ===");
console.log(`  page1 -> count=${p1.json.count} total=${p1.json.total} totalPages=${p1.json.totalPages} ids=${p1.json.clients.length}`);
console.log(`  page2 -> count=${p2.json.count} ids=${p2.json.clients.length}`);
console.log(`  page3 -> count=${p3.json.count} ids=${p3.json.clients.length}`);

const overlap = p1.json.clients.filter((c) => p2.json.clients.some((d) => d.id === c.id));
console.log(`  page1/page2 overlap -> ${overlap.length} (expect 0)`);
const unique = new Set([...p1.json.clients, ...p2.json.clients, ...p3.json.clients].map((c) => c.id));
console.log(`  union of pages -> ${unique.size} (expect 5)`);

console.log("=== validation ===");
for (const q of ["limit=0", "limit=abc", "page=-1", "limit=999", "limit=2.5"]) {
  const r = await api(`/api/clients?${q}`, token);
  console.log(`  ?${q} -> ${r.status} ${r.json?.error?.code ?? ""}`);
}

console.log("=== filtered pagination ===");
const won = await api("/api/clients?stage=WON&limit=1", token);
console.log(`  stage=WON -> status=${won.status} count=${won.json.count} total=${won.json.total}`);

for (const id of created) {
  await api(`/api/clients/${id}`, token, { method: "DELETE" });
}
console.log(`\ncleaned up ${created.length} test clients`);