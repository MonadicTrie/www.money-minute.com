# Money Minute

A static blog built with Eleventy, published by GitHub Pages, and edited in the
browser with Decap CMS. The confirmed site domain is **www.money-minute.com**.
No articles or business claims have been supplied; the home page starts empty.

**Current state:** GitHub Pages is enabled with **GitHub Actions** as its source,
but this site's code has not been merged or deployed. Nothing has changed Cloudflare
DNS, created an OAuth app, or deployed the OAuth Worker. The proposed OAuth
hostname `cms-auth.money-minute.com` must be approved and configured before
browser sign-in will work.

## Develop

Use Node.js **22.12 or later** and npm:

```powershell
npm ci
npm run dev
```

Open the URL printed by Eleventy. `npm run check` runs the tests and production
build. `npm run oauth:check` bundles the Worker without deploying it. Output is
in `_site`; edit source files rather than generated output.

The pinned Decap distribution is copied from npm into the site's admin folder;
the production editor does not load JavaScript from an unpinned CDN.

## Enable GitHub Pages

1. Review and merge this setup into `main`.
2. In the repository's **Settings > Pages**, confirm **Source: GitHub Actions**
   (already enabled). The temporary Pages URL is
   `https://monadictrie.github.io/www.money-minute.com/`; no custom domain is
   attached yet.
3. Verify ownership of `money-minute.com` in the GitHub account's **Settings >
   Pages** using the account-specific TXT record GitHub provides. Obtain
   permission before creating any DNS record.
4. Set the repository's Pages **Custom domain** to `www.money-minute.com`
   **before** pointing DNS at GitHub, to reduce domain takeover risk.
5. With DNS approval, create a Cloudflare **DNS-only** CNAME record:
   name `www`, target `monadictrie.github.io` (no repository path).
   Inspect existing records first; do not overwrite unrelated records.
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

1. Approve the proposed OAuth hostname `cms-auth.money-minute.com`. Alternatives
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
4. With explicit DNS/service approval, attach `cms-auth.money-minute.com` to the
   Worker under **Workers & Pages > money-minute-cms-oauth > Settings > Domains
   & Routes > Add > Custom Domain**. Cloudflare manages that hostname's DNS and
   TLS. Do not point it at GitHub Pages. The configuration intentionally has no
   route that creates a DNS record during `wrangler deploy`.
5. Ensure `main` has the final CMS OAuth hostname, deploy the site, and open
   `https://www.money-minute.com/admin/`. Verify sign-in with an invited editor,
   create a draft, review its PR, publish it, and confirm the Pages workflow.

The Worker pins the GitHub callback and requested `public_repo` scope, signs
short-lived state and binds it to a Secure/HttpOnly cookie, checks repository
Write permission, and sends the token only to the configured CMS origin after
the Decap handshake. Token responses are uncached and use a nonce-based CSP.
The client secret never enters the browser. Automated tests use fake tokens;
real login cannot be verified until the app and Worker are provisioned.

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

Before inviting students, enable a branch ruleset for `main` that requires a
pull request, at least one approval, and the **build** status check from
**Publish site**. Do not allow student bypasses or direct pushes. Until those
rules are configured, Decap's editorial mode is a workflow convention, not an
enforced separation of author and publisher: Write users can publish/merge.
The reviewer can merge approved PRs in GitHub if CMS publishing is blocked by
repository rules. Branch-rule enforcement is an owner setup step, not something
this scaffold claims to have enabled.

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