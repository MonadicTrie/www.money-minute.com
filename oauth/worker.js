const COOKIE = "__Host-decap-state";
const MAX_AGE = 600;
const encoder = new TextEncoder();

class ConfigurationError extends Error {}
class UpstreamError extends Error {}

function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function decode(value) {
  return Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), (char) => char.charCodeAt(0));
}

function origin(value) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:" && url.href === `${url.origin}/`) return url.origin;
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
  }
  throw new ConfigurationError("OAuth and CMS origins must be HTTPS origins without paths.");
}

function configuration(env) {
  for (const name of ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "STATE_SECRET", "CMS_ORIGIN", "OAUTH_ORIGIN", "GITHUB_REPO"]) {
    if (!env[name]) throw new ConfigurationError(`Missing binding: ${name}.`);
  }
  if (env.STATE_SECRET.length < 32) throw new ConfigurationError("STATE_SECRET must contain at least 32 characters.");
  if (!/^[\w.-]+\/[\w.-]+$/u.test(env.GITHUB_REPO)) throw new ConfigurationError("Invalid GITHUB_REPO.");
  return { cms: origin(env.CMS_ORIGIN), oauth: origin(env.OAUTH_ORIGIN) };
}

async function stateKey(secret) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function createState(secret) {
  const nonce = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const payload = base64url(encoder.encode(JSON.stringify({ nonce, issuedAt: Math.floor(Date.now() / 1000) })));
  const signature = await crypto.subtle.sign("HMAC", await stateKey(secret), encoder.encode(payload));
  return `${payload}.${base64url(new Uint8Array(signature))}`;
}

async function validState(state, cookie, secret) {
  if (!state || state !== cookie || state.length > 1024) return false;
  const parts = state.split(".");
  if (parts.length !== 2 || parts.some((part) => !/^[\w-]+$/u.test(part))) return false;
  try {
    const verified = await crypto.subtle.verify("HMAC", await stateKey(secret), decode(parts[1]), encoder.encode(parts[0]));
    if (!verified) return false;
    const { issuedAt, nonce } = JSON.parse(new TextDecoder().decode(decode(parts[0])));
    const age = Math.floor(Date.now() / 1000) - issuedAt;
    return typeof nonce === "string" && nonce.length === 43 && Number.isInteger(issuedAt) && age >= 0 && age <= MAX_AGE;
  } catch (error) {
    if (error instanceof DOMException || error instanceof SyntaxError) return false;
    throw error;
  }
}

function headers() {
  return {
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  };
}

function cookie(value, maxAge) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function text(message, status) {
  return new Response(message, { status, headers: { ...headers(), "Content-Type": "text/plain; charset=utf-8" } });
}

function scriptJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026");
}

function popup(cmsOrigin, payload, success, status = 200) {
  const nonce = base64url(crypto.getRandomValues(new Uint8Array(18)));
  const message = `authorization:github:${success ? "success" : "error"}:${JSON.stringify(payload)}`;
  const body = `<!doctype html><html lang="en"><meta charset="utf-8"><title>GitHub sign-in</title>
<p id="status">${success ? "Completing sign-in..." : "Sign-in failed. Return to the editor and try again."}</p>
<script nonce="${nonce}">
const cmsOrigin = ${scriptJson(cmsOrigin)};
const result = ${scriptJson(message)};
if (!window.opener) {
  document.getElementById("status").textContent = "Open sign-in from the site editor.";
} else {
  window.addEventListener("message", function handshake(event) {
    if (event.origin !== cmsOrigin || event.source !== window.opener || event.data !== "authorizing:github") return;
    window.removeEventListener("message", handshake);
    window.opener.postMessage(result, cmsOrigin);
    window.close();
  });
  window.opener.postMessage("authorizing:github", cmsOrigin);
  setTimeout(() => { document.getElementById("status").textContent = "If sign-in has not completed, close this window and try again from the editor."; }, 15000);
}
</script></html>`;
  return new Response(body, {
    status,
    headers: {
      ...headers(),
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`,
      "Set-Cookie": cookie("", 0),
    },
  });
}

async function githubJson(fetcher, url, options) {
  let response;
  try {
    response = await fetcher(url, { ...options, signal: AbortSignal.timeout(10000), redirect: "error" });
  } catch (error) {
    if (error instanceof TypeError || error instanceof DOMException) {
      throw new UpstreamError("GitHub could not be reached.");
    }
    throw error;
  }
  if (!response.ok) throw new UpstreamError("GitHub rejected the request.");
  try {
    return await response.json();
  } catch (error) {
    if (error instanceof SyntaxError) throw new UpstreamError("GitHub returned an invalid response.");
    throw error;
  }
}

export async function handleRequest(request, env, fetcher = fetch) {
  const url = new URL(request.url);
  if (request.method !== "GET") return text("Method not allowed.", 405);
  if (!["/auth", "/callback"].includes(url.pathname)) return text("Not found.", 404);
  let config;
  try {
    config = configuration(env);
    if (url.origin !== config.oauth) return text("Use the configured OAuth hostname.", 400);
    if (url.pathname === "/auth") {
      if (url.searchParams.get("provider") !== "github") return text("Only GitHub sign-in is supported.", 400);
      const state = await createState(env.STATE_SECRET);
      const authorize = new URL("https://github.com/login/oauth/authorize");
      authorize.search = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        redirect_uri: `${config.oauth}/callback`,
        scope: "public_repo",
        state,
      }).toString();
      return new Response(null, {
        status: 302,
        headers: { ...headers(), Location: authorize.href, "Set-Cookie": cookie(state, MAX_AGE) },
      });
    }
    const storedState = request.headers.get("Cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
    if (!(await validState(url.searchParams.get("state"), storedState, env.STATE_SECRET))) {
      return popup(config.cms, { message: "Sign-in expired or could not be verified. Please try again." }, false, 400);
    }
    if (url.searchParams.has("error")) {
      return popup(config.cms, { message: "GitHub authorization was declined." }, false, 400);
    }
    const code = url.searchParams.get("code");
    if (!code || code.length > 1024) return popup(config.cms, { message: "GitHub did not return an authorization code." }, false, 400);
    const token = await githubJson(fetcher, "https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        redirect_uri: `${config.oauth}/callback`,
        code,
      }),
    });
    if (typeof token.access_token !== "string" || !token.access_token || token.token_type?.toLowerCase() !== "bearer") {
      return popup(config.cms, { message: "GitHub did not issue a usable access token. Please try again." }, false, 400);
    }
    const repo = await githubJson(fetcher, `https://api.github.com/repos/${env.GITHUB_REPO}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token.access_token}`,
        "User-Agent": "money-minute-cms-oauth",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (repo.permissions?.push !== true) {
      return popup(config.cms, { message: "Your GitHub account needs Write access to the content repository. Ask the site owner for an invitation." }, false, 403);
    }
    return popup(config.cms, { token: token.access_token, provider: "github" }, true);
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error(error.message);
      return text("OAuth service is not configured. Contact the site owner.", 503);
    }
    if (error instanceof UpstreamError) {
      console.error(error.message);
      return popup(config.cms, { message: error.message }, false, 502);
    }
    throw error;
  }
}

export default { fetch: (request, env) => handleRequest(request, env) };
