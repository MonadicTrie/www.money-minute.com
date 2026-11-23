# Money Minute

A static blog built with Eleventy, published by GitHub Pages, and edited in the
browser with Decap CMS. The confirmed site domain is **www.money-minute.com**.
No articles or business claims have been supplied; the home page starts empty.

**Current state:** the site is deployed to GitHub Pages with the custom domain
`www.money-minute.com` and a DNS-only Cloudflare CNAME pointing to
`monadictrie.github.io`. The OAuth Worker is deployed at
`cms-auth.money-minute.com`, with its three credentials stored as encrypted
Cloudflare secrets. GitHub's website certificate is issued and HTTPS is enforced.
A `main` branch ruleset requires review and a passing build, with an owner/admin
bypass.

## Develop

Use Node.js **22.12 or later** and npm:

```powershell
npm ci
npm run dev
```

Open the URL printed by Eleventy. `npm run check` runs the tests and production
build. `npm run oauth:check` bundles the Worker without deploying it. Output is
in `_site`; edit source files rather than generated output.
The OAuth tests include the real Workers runtime, with mocked GitHub responses
and fake credentials, to catch differences from Node's Fetch implementation.

The pinned Decap distribution is copied from npm into the site's admin folder;
the production editor does not load JavaScript from an unpinned CDN.
The local server previews the public site; CMS sign-in is deliberately limited
to `https://www.money-minute.com`. Edit Markdown locally or use the production
editor rather than trying to authenticate the CMS from localhost.

## Enable GitHub Pages

1. The initial setup is already on `main`. Review and merge future changes there.
2. In the repository's **Settings > Pages**, confirm **Source: GitHub Actions**
   (already enabled). The original Pages URL is
   `https://monadictrie.github.io/www.money-minute.com/`; it redirects to the
   configured custom domain.
3. Verify ownership of `money-minute.com` in the GitHub account's **Settings >
   Pages** using the account-specific TXT record GitHub provides. Obtain
   permission before creating any DNS record.
4. The repository's Pages **Custom domain** is set to `www.money-minute.com`.
   Set this **before** pointing DNS at GitHub when repeating this setup, to
   reduce domain takeover risk.
5. With DNS approval, create a Cloudflare **DNS-only** CNAME record:
   name `www`, target `monadictrie.github.io` (no repository path).
   This record is now configured. Inspect existing records first when making
   future changes; do not overwrite unrelated records.
6. When GitHub's certificate is ready, enable **Enforce HTTPS**.
7. Run the **Publish site** workflow or push to `main`. Before the custom domain
   is configured, its build uses the default Pages project path automatically.

The Actions publishing source does **not** use a `CNAME` file; the Pages setting
is authoritative. No apex-domain redirect is configured. If you also want
`money-minute.com` to redirect to `www`, approve and configure that separately.

PRs run the tests and a build but never deploy or receive Pages write privileges.
Published changes deploy only from `main`. A daily rebuild after 06:17 UTC
includes newly eligible future-dated posts; Actions schedules can be delayed
and are not an exact publishing timer. GitHub can disable schedules in inactive
public repositories after 60 days; manually run the workflow to publish if needed.

## GitHub sign-in with a Cloudflare Worker

GitHub Pages cannot run an OAuth server. Cloudflare Workers can: the included
Worker handles the authorization redirect, server-side code exchange, and
Decap popup handshake. It does not need a database or a Netlify account.
Google sign-in is not part of this setup; editors use GitHub accounts.

Complete these steps yourself, or explicitly authorize deployment through an
authenticated Cloudflare account. **Never paste secrets in an issue or chat.**

1. The configured OAuth hostname is `cms-auth.money-minute.com`. Alternatives
   include the Worker's assigned `workers.dev` hostname, which needs no custom
   DNS record. Keep the actual HTTPS origin identical in
   `oauth/wrangler.jsonc` (`OAUTH_ORIGIN`) and `src/admin/config.yml`
   (`backend.base_url`). `CMS_ORIGIN` is the exact site origin:
   `https://www.money-minute.com` (no path). Do not add wildcard origins.
2. Create a **GitHub OAuth App** in **GitHub Settings > Developer settings >
   OAuth Apps > New OAuth App**:
   application name `Money Minute editor`, homepage
   `https://www.money-minute.com`, authorization callback URL
   `https://cms-auth.money-minute.com/callback` (or the selected Worker origin
   followed by `/callback`). Keep the client secret private.
3. Authenticate Wrangler with `npx wrangler login`, then provision the Worker
   and secrets using the configuration below. For a new Worker,
   `wrangler secret put` may offer to create it: only accept after deployment
   is approved.

   ```powershell
   npx wrangler secret put GITHUB_CLIENT_ID --config oauth\wrangler.jsonc
   npx wrangler secret put GITHUB_CLIENT_SECRET --config oauth\wrangler.jsonc
   npx wrangler secret put STATE_SECRET --config oauth\wrangler.jsonc
   npm run oauth:deploy
   ```

   `STATE_SECRET` should be a password-manager-generated random value with at
   least 32 characters. Use the interactive secret prompts; do not put these
   values into command arguments, source files, or Wrangler `vars`.
4. The approved `cms-auth.money-minute.com` custom domain is attached to the
   Worker and declared in `oauth/wrangler.jsonc`. Future `wrangler deploy`
   commands maintain this routing. Cloudflare manages that hostname's DNS and
   TLS. Do not point it at GitHub Pages. Approve any replacement domain and its
   DNS changes before modifying the route.
5. Ensure `main` has the final CMS OAuth hostname, deploy the site, and open
   `https://www.money-minute.com/admin/`. Verify sign-in with an invited editor,
   create a draft, review its PR, publish it, and confirm the Pages workflow.

The Worker pins the GitHub callback and requested `public_repo` scope, signs
short-lived state and binds it to a Secure/HttpOnly cookie, checks repository
Write permission, and sends the token only to the configured CMS origin after
the Decap handshake. Token responses are uncached and use a nonce-based CSP.
The client secret never enters the browser. Automated tests use fake tokens;
verify real browser login after the website's HTTPS certificate is ready.

**Permission tradeoff:** GitHub OAuth's `public_repo` is not repository-scoped:
it can grant access to other public repositories the editor can access.
GitHub may retain previously granted broader scopes for the same OAuth app.
Use a dedicated app and revoke/re-authorize if reducing prior scopes.
The Worker verifies access to this repo but cannot make the issued token
repo-scoped. Decap stores the token in the editor's browser; use trusted devices,
log out when finished, and revoke the app in GitHub if access is compromised.
All users with Write access must be trusted with this public repository's code
and uploads, not just blog text. Do not use this model for untrusted public
submissions. No tokens, authorization codes, or secrets are intentionally logged.

## Student and reviewer workflow

Invite editors as GitHub repository collaborators with **Write** access; they
must accept the invitation and have a GitHub account. Public visibility alone
does not grant editing rights.

1. Open `/admin/` and choose **Login with GitHub**.
2. In **Posts**, create a post, add its title, summary, author, date, optional
   category/cover, and body. The Markdown editor has a rich-text mode and media
   uploads; no local developer tools are required. Supply meaningful cover alt
   text, or leave it empty only for a decorative image.
3. **Save** creates a draft branch/PR, not a live article. Use the Workflow view
   to move it to **In review**. A reviewer checks text, image rights, alt text,
   links, and the passing build before publishing.
4. **Publish** merges the PR into `main`, which triggers Pages. Settings edits
   follow the same workflow. Newly uploaded media is public repository content,
   even before an article is published; never upload confidential information.

The **Editorial review** branch ruleset is enabled for `main`: it requires a
pull request, one approval, resolved review threads, and the **build** check
from GitHub Actions. New pushes dismiss stale approvals. Only repository
administrators can bypass these rules; ordinary Write collaborators cannot
push directly or publish unreviewed drafts. Invite students with Write access,
not administrator access. An owner/admin can publish their own work using the
bypass. Reviewers can merge approved PRs in GitHub if CMS publishing is blocked
by repository rules. Do not disable the rules merely to make CMS publishing
easier.

**Site settings > Text and design** allows editing the site's title, description,
home-page heading/introduction, three colour palettes, serif/sans-serif fonts,
and comfortable/compact spacing. Arbitrary CSS, HTML, and deployment settings
are deliberately not CMS fields. Raw HTML in post Markdown is rendered as text.
The public site needs no JavaScript; the editor is a separate browser application.
There are no deploy previews in this setup; review the draft text in Decap or
build its branch locally.

## Content and maintenance

- Posts: `src/posts/*.md`; media: `src/uploads`; design: `src/_data/settings.json`.
- Templates: `src/_includes`; styles: `src/assets/site.css`; CMS: `src/admin`.
- OAuth: `oauth/worker.js`; non-secret environment settings: `oauth/wrangler.jsonc`.
- A post's filename determines its permanent URL. Avoid renaming published posts
  without adding a redirect. Future dates hide the page, index, feed, and sitemap
  until a rebuild; this is not private storage or embargo protection.
- Keep dependency updates reviewed and rerun `npm run check` and
  `npm run oauth:check`. Local `.dev.vars*` and `.env*` files are ignored by git;
  production credentials belong only in Cloudflare secrets.

References: [Decap GitHub backend](https://decapcms.org/docs/github-backend/),
[editorial workflow](https://decapcms.org/docs/editorial-workflows/),
[external OAuth](https://decapcms.org/docs/external-oauth-clients/),
[Cloudflare secrets](https://developers.cloudflare.com/workers/configuration/secrets/),
[GitHub Pages custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).