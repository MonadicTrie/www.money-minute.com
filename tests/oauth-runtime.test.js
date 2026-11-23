import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";

const env = {
  GITHUB_CLIENT_ID: "test-client",
  GITHUB_CLIENT_SECRET: "test-only-not-a-real-secret",
  STATE_SECRET: "test-only-state-signing-secret-at-least-32-characters",
  CMS_ORIGIN: "https://www.money-minute.com",
  OAUTH_ORIGIN: "https://cms-auth.money-minute.com",
  GITHUB_REPO: "MonadicTrie/www.money-minute.com",
};

async function authenticate(runtime) {
  const auth = await runtime.dispatchFetch(`${env.OAUTH_ORIGIN}/auth?provider=github`, { redirect: "manual" });
  assert.equal(auth.status, 302);
  const state = new URL(auth.headers.get("Location")).searchParams.get("state");
  return runtime.dispatchFetch(`${env.OAUTH_ORIGIN}/callback?state=${encodeURIComponent(state)}&code=test-code`, {
    headers: { Cookie: auth.headers.get("Set-Cookie").split(";")[0] },
  });
}

test("OAuth exchanges credentials successfully in the real Workers runtime", async () => {
  const requests = [];
  const runtime = new Miniflare(convertV4MiniflareOptions({
    workers: [{
      modules: true,
      scriptPath: fileURLToPath(new URL("../oauth/worker.js", import.meta.url)),
      compatibilityDate: "2026-11-01",
      bindings: env,
      outboundService: async (request) => {
        requests.push({ url: request.url, method: request.method, body: await request.text() });
        return Response.json(requests.length === 1
          ? { access_token: "test-token", token_type: "bearer" }
          : { permissions: { push: true } });
      },
    }],
  }));
  try {
    const response = await authenticate(runtime);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /authorization:github:success/u);
    assert.equal(requests.length, 2);
    assert.equal(requests[0].url, "https://github.com/login/oauth/access_token");
    assert.equal(new URLSearchParams(requests[0].body).get("client_secret"), env.GITHUB_CLIENT_SECRET);
    assert.equal(requests[1].url, `https://api.github.com/repos/${env.GITHUB_REPO}`);
  } finally {
    await runtime.dispose();
  }
});

test("Workers runtime rejects upstream redirects without forwarding credentials", async () => {
  let requests = 0;
  const runtime = new Miniflare(convertV4MiniflareOptions({
    workers: [{
      modules: true,
      scriptPath: fileURLToPath(new URL("../oauth/worker.js", import.meta.url)),
      compatibilityDate: "2026-11-01",
      bindings: env,
      outboundService: () => {
        requests++;
        return new Response(null, { status: 302, headers: { Location: "https://evil.example/" } });
      },
    }],
  }));
  try {
    const response = await authenticate(runtime);
    assert.equal(response.status, 502);
    assert.match(await response.text(), /GitHub rejected the request/u);
    assert.equal(requests, 1);
  } finally {
    await runtime.dispose();
  }
});
