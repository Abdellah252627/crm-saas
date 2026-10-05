const BASE = "http://localhost:4000";

function cookieFrom(res) {
  const raw = res.headers.getSetCookie?.() ?? [];
  for (const c of raw) {
    const m = /^refreshToken=([^;]*)/.exec(c);
    if (m) return m[1];
  }
  return null;
}

async function post(path, body, cookie) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: `refreshToken=${cookie}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* empty body */
  }
  return { status: res.status, json, cookie: cookieFrom(res) };
}

const email = `rot.${Date.now()}@example.com`;
const reg = await post("/api/auth/register", {
  name: "Rot User",
  email,
  password: "SuperSecret123",
});
console.log(`register                -> ${reg.status}`);

const first = reg.cookie;
console.log(`session cookie issued   -> ${first ? `yes (${first.length} chars)` : "NO"}`);

const rotated = await post("/api/auth/refresh", null, first);
console.log(`refresh #1              -> ${rotated.status}`);
console.log(`rotated cookie differs  -> ${rotated.cookie !== first}`);
console.log(`access token returned   -> ${Boolean(rotated.json?.accessToken)}`);

const replay = await post("/api/auth/refresh", null, first);
console.log(`replay old token        -> ${replay.status} ${replay.json?.error?.code ?? ""}`);
console.log(`  message               -> ${replay.json?.error?.message ?? ""}`);

const afterFamilyRevoke = await post("/api/auth/refresh", null, rotated.cookie);
console.log(`family-wide revocation  -> ${afterFamilyRevoke.status} ${afterFamilyRevoke.json?.error?.code ?? ""}`);

const garbage = await post("/api/auth/refresh", null, "not-a-real-token");
console.log(`garbage token           -> ${garbage.status} ${garbage.json?.error?.code ?? ""}`);