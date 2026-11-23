import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { handleRequest } from "../oauth/worker.js";

const env = {
  GITHUB_CLIENT_ID: "test-client",
  GITHUB_CLIENT_SECRET: "test-only-not-a-real-secret",
  STATE_SECRET: "test-only-state-signing-secret-at-least-32-characters",
  CMS_ORIGIN: "https://www.money-minute.com",
  OAUTH_ORIGIN: "https://cms-auth.money-minute.com",
  GITHUB_REPO: "MonadicTrie/www.money-minute.com",
};
const authRequest = () => new Request(`${env.OAUTH_ORIGIN}/auth?provider=github&scope=repo&site_id=evil.example`);

async function login() {
  const response = await handleRequest(authRequest(), env);
  return {
    response,
    state: new URL(response.headers.get("Location")).searchParams.get("state"),
    cookie: response.headers.get("Set-Cookie").split(";")[0],
  };
}

function callback(state, cookie, extra = "code=test-code") {
  return new Request(`${env.OAUTH_ORIGIN}/callback?state=${encodeURIComponent(state)}&${extra}`, { headers: { Cookie: cookie } });
}

test("authorization pins callback and scope, and binds state to a secure browser cookie", async () => {
  const { response, state } = await login();
  const target = new URL(response.headers.get("Location"));
  assert.equal(response.status, 302);
  assert.equal(target.origin, "https://github.com");
  assert.equal(target.searchParams.get("scope"), "public_repo");
  assert.equal(target.searchParams.get("redirect_uri"), `${env.OAUTH_ORIGIN}/callback`);
  assert.match(response.headers.get("Set-Cookie"), /__Host-decap-state=.+; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=600/u);
  assert.ok(state.length > 80);
});

test("callback rejects absent, tampered, cross-browser, and expired state before contacting GitHub", async () => {
  const { state, cookie } = await login();
  const other = await login();
  const noFetch = () => assert.fail("Invalid state must not reach GitHub");
  for (const request of [callback("", ""), callback(`${state}x`, cookie), callback(state, other.cookie), callback(`${state}x`, `__Host-decap-state=${state}x`)]) {
    const response = await handleRequest(request, env, noFetch);
    assert.equal(response.status, 400);
    assert.match(await response.text(), /could not be verified/u);
    assert.match(response.headers.get("Set-Cookie"), /Max-Age=0/u);
  }
  const realNow = Date.now;
  try {
    Date.now = () => realNow() + 601000;
    assert.equal((await handleRequest(callback(state, cookie), env, noFetch)).status, 400);
  } finally {
    Date.now = realNow;
  }
});

test("successful sign-in checks Write permission and implements the origin-bound Decap handshake", async () => {
  const { state, cookie } = await login();
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    return Response.json(calls.length === 1 ? { access_token: "test-token</script>", token_type: "bearer" } : { permissions: { push: true } });
  };
  const response = await handleRequest(callback(state, cookie), env, fetcher);
  assert.equal(response.status, 200);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.body.get("client_secret"), env.GITHUB_CLIENT_SECRET);
  assert.equal(calls[1].url, `https://api.github.com/repos/${env.GITHUB_REPO}`);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.match(response.headers.get("Content-Security-Policy"), /script-src 'nonce-/u);
  const html = await response.text();
  assert.ok(!html.includes(env.GITHUB_CLIENT_SECRET));
  assert.ok(!html.includes("test-token</script>"));
  const script = html.match(/<script nonce="[^"]+">([\s\S]+)<\/script>/u)[1];
  const messages = [];
  const listeners = new Map();
  const opener = { postMessage: (data, target) => messages.push({ data, target }) };
  let closed = false;
  const window = { opener, addEventListener: (type, handler) => listeners.set(type, handler), removeEventListener: (type) => listeners.delete(type), close: () => { closed = true; } };
  vm.runInNewContext(script, { window, setTimeout: () => {}, document: { getElementById: () => ({}) } });
  assert.deepEqual(messages, [{ data: "authorizing:github", target: env.CMS_ORIGIN }]);
  const handshake = listeners.get("message");
  handshake({ origin: "https://evil.example", source: opener, data: "authorizing:github" });
  handshake({ origin: env.CMS_ORIGIN, source: {}, data: "authorizing:github" });
  assert.equal(messages.length, 1);
  handshake({ origin: env.CMS_ORIGIN, source: opener, data: "authorizing:github" });
  assert.equal(messages[1].target, env.CMS_ORIGIN);
  assert.equal(messages[1].data, 'authorization:github:success:{"token":"test-token</script>","provider":"github"}');
  assert.equal(closed, true);
  assert.equal(listeners.size, 0);
});

test("read-only accounts cannot receive a CMS token", async () => {
  const { state, cookie } = await login();
  let calls = 0;
  const response = await handleRequest(callback(state, cookie), env, async () =>
    Response.json(++calls === 1 ? { access_token: "test-token", token_type: "bearer" } : { permissions: { push: false } }),
  );
  assert.equal(response.status, 403);
  const html = await response.text();
  assert.match(html, /needs Write access/u);
  assert.ok(!html.includes("test-token"));
});

test("declined consent and invalid token responses return Decap errors without leaking provider data", async () => {
  const { state, cookie } = await login();
  const declined = await handleRequest(callback(state, cookie, "error=access_denied"), env, () => assert.fail("Consent was declined"));
  assert.equal(declined.status, 400);
  assert.match(await declined.text(), /authorization:github:error/u);
  const invalid = await handleRequest(callback(state, cookie), env, async () => Response.json({ error: "secret provider detail" }));
  assert.equal(invalid.status, 400);
  assert.ok(!(await invalid.text()).includes("secret provider detail"));
});

test("upstream failures are explicit and do not return tokens", async () => {
  const { state, cookie } = await login();
  for (const fetcher of [
    async () => new Response("unavailable", { status: 503 }),
    async () => new Response("not JSON", { status: 200 }),
    async () => { throw new TypeError("Network failed with sensitive URL"); },
  ]) {
    const response = await handleRequest(callback(state, cookie), env, fetcher);
    assert.equal(response.status, 502);
    const html = await response.text();
    assert.match(html, /authorization:github:error/u);
    assert.ok(!html.includes("sensitive URL"));
  }
});

test("unconfigured service, wrong host, unsupported providers, and unknown routes fail explicitly", async () => {
  assert.equal((await handleRequest(authRequest(), { ...env, GITHUB_CLIENT_SECRET: "" })).status, 503);
  assert.equal((await handleRequest(authRequest(), { ...env, CMS_ORIGIN: "http://localhost" })).status, 503);
  assert.equal((await handleRequest(new Request("https://evil.example/auth?provider=github"), env)).status, 400);
  assert.equal((await handleRequest(new Request(`${env.OAUTH_ORIGIN}/auth?provider=google`), env)).status, 400);
  assert.equal((await handleRequest(new Request(`${env.OAUTH_ORIGIN}/unknown`), env)).status, 404);
  assert.equal((await handleRequest(new Request(`${env.OAUTH_ORIGIN}/auth`, { method: "POST" }), env)).status, 405);
});
