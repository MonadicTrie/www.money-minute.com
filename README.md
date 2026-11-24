# Welcome to Money Minute

This is the starting guide for new student editors. You can write posts, update
pages, and suggest design changes **in your browser, without coding**.

Start with the publishing process below. You do not need to understand
networking, DNS, or how the sign-in software works to contribute.

| Go here | Use it to |
| --- | --- |
| [Public website](https://www.money-minute.com/) | Read what is currently published. |
| [Editor](https://www.money-minute.com/admin/) | Write and edit content after signing in. |
| [Project on GitHub](https://github.com/MonadicTrie/www.money-minute.com) | See proposed changes, reviews, and project history. |

## 1. Understand the publishing process

Think of the project like a school magazine: you prepare an article, someone
reviews it, and an approved version is published for readers.

**Write a draft -> Ask for review -> Make improvements -> Publish -> Check the website**

| Stage | What it means |
| --- | --- |
| Draft | Work you have saved but have not yet published on the website. |
| In review | You are asking someone to check your work and give feedback. |
| Approved | A reviewer has approved the proposed change in GitHub. |
| Published | The approved change has been accepted, and the website has finished updating. |

**Saving is not publishing.** A saved draft does not immediately replace the
live page. After a change is accepted, the website also takes a little time to
update automatically.

**Unpublished does not mean private.** This project's files and history are
public on GitHub, including saved drafts and uploaded pictures. Only save
material that is safe for the public to see.

## 2. Get ready to edit

Ask your teacher or project lead which small task to start with and who will
review it. For example, agree to improve a paragraph on the About page.

You need a GitHub account and an invitation to edit this project. **GitHub**
is the service where we keep our files, record changes, and review each
other's work. A **repository**, or **repo**, is the project's folder of files
and their history.

1. Use your approved GitHub account and accept the project's invitation.
   Editors need **Write** access; being able to read the public repo is not enough.
2. Open the [editor](https://www.money-minute.com/admin/).
3. Choose **Login with GitHub**. Sign in on GitHub's genuine sign-in page and
   read the access request before approving it.
4. Find **Posts**, **Pages**, and **Site settings** in the editor.

You do not need to install anything or request Cloudflare access. If the
invitation or sign-in fails, ask the project lead rather than creating new
project accounts or changing settings.

The sign-in permission can allow changes to **other public repositories you
can access**, not just Money Minute. Use a trusted device, log out when finished
on a shared computer, and ask the project lead if the permission request is
unclear. Never give anyone your GitHub password.

## 3. Create and save your draft

For your first task, make one small, agreed change rather than rewriting the
whole site.

Choose the relevant part of the editor:

| Section | What you can change |
| --- | --- |
| **Posts** | Articles, with a title, summary, author, date, and main text. |
| **Pages** | The About, Resources, and Contact pages. |
| **Site settings > Text and design** | Site title and introduction, colours, fonts, spacing, and social links. |

For a new post:

1. Open **Posts** and create a new entry.
2. Add a clear title and a short summary explaining what readers will learn.
3. Use your approved author byline and choose the publication date.
4. Write the main text. Use headings to organise it, explain unfamiliar terms,
   check facts, and link to your sources.
5. Add an optional cover image only if you have permission to publish it.
   Give it a useful description for people using screen readers; leave the
   description blank only if the image is purely decorative.
6. Choose **Save**, keeping the work as a draft.

The editor offers rich-text formatting, so you do not need to learn code to
write. Reopen your saved entry and check that your changes are there.

The About, Resources, and Contact text starts as clearly marked example copy.
Replace it only with accurate, approved project information. The Contact page
does not include a working message form.

**Dates:** a future-dated post stays off the website until a rebuild on or after
that date, evaluated in UTC. This is not a precise publish-at-a-minute timer,
and its saved draft is still public in GitHub.

## 4. Ask for review and respond to feedback

Move the saved entry to **In review** in the editor's Workflow view. Tell your
agreed reviewer what you changed and what you would like them to check.

Behind the scenes, the editor creates a **pull request**, usually called a
**PR**. This is a proposal to change the project. It lets the team compare the
old and new versions, discuss improvements, and approve the change before it
goes live. You do not need Git commands to create it through the editor.

Before approving, the reviewer should check:

- The facts are supported and sources are credited.
- The writing is clear, with useful headings and working links.
- Images have permission and appropriate descriptions.
- There is no private information or unfinished example text.
- The project's automatic checks have passed.

Read feedback, improve the draft, and save again. Changes can require a fresh
approval. The automatic checks catch some mistakes, but cannot judge whether a
claim is true or an image has permission.

There is no separate public preview website for each draft. Review the saved
text in the editor and the proposed changes in GitHub; ask a maintainer if you
need help checking a layout before publication.

## 5. Publish and check the result

Follow your teacher's or project lead's publishing arrangements. When the work
is approved and the checks allow it, the authorised person can publish it.

**Moving an entry to Ready is not the same as a reviewer's GitHub approval.**
The project requires an approval, passing checks, and resolved review
discussions. If publishing is blocked, ask your reviewer to check the proposal;
do not disable the rules.

Publishing accepts the change into **main**, the project's agreed version.
An automatic process then checks the files, assembles the website, and puts
the updated pages online. This is called a **build and deployment**.

Once that process finishes, open the actual page on the
[public website](https://www.money-minute.com/). Check its text, images, links,
and appearance on a small screen. Do not assume it is live just because you
clicked Publish. Tell your reviewer when you have checked it.

If you spot a mistake afterwards, tell the team and prepare a correction
through the same review process. Ask a maintainer to handle anything urgent.

## Design and social links

Agree on site-wide changes before editing **Site settings**: they can affect
every page, not just your article. The available choices include colour
palettes, font styles, and spacing. More substantial layout changes need a
maintainer's help.

Social handles such as `@your-project` are marked **Placeholder** and are not
clickable. They are examples, not real project accounts.
Under **Site settings > Text and design > Social links**, add an approved
profile's full `https://` address to make a link, or remove an unwanted entry.
A blank address keeps it as a placeholder. Do not link to someone else's
account just because its name looks suitable.

## Keep yourself and the project safe

Only save content that is suitable for a public project. Do not upload private
student details, personal contact information, passwords, or photographs
without the required permission. This applies to **drafts and uploads too**.

Never paste passwords or access tokens into articles, reviews, issues, or chat.
If you accidentally share something private, tell the project lead immediately.
Simply deleting it may leave a copy in the recorded history; a leaked password
or token must also be revoked or replaced.

Writers do not need administrator access or permission to change the domain or
sign-in system. Leave those settings to the maintainer.

## When something does not work

| Problem | First step |
| --- | --- |
| I cannot sign in or save | Check that you accepted the invitation using the right GitHub account; ask the project lead about Write access. |
| The sign-in popup expired | Close it and start sign-in again from the editor. Do not share the popup's return address. |
| My saved work is not on the website | Check whether it is still a draft, awaiting approval, or waiting for the website update. |
| Publishing is blocked | Ask the reviewer to check approval, feedback, and automatic checks on the PR. |
| An approved change still does not appear | Ask a maintainer to check the update process and publication date; then try refreshing the page. |
| The editor is missing new fields | Refresh the editor to reload its configuration. |

When asking for help, explain what you tried, what you expected, and the safe
error message you saw. Do not include passwords, tokens, or the sign-in
popup's address. You do not need to diagnose the infrastructure yourself.

## Optional: how the project works

**You can skip this section and still be a successful editor.**

Git records changes to files. GitHub hosts those files and provides the review
tools. Decap is our browser editor: it saves your changes into GitHub for you.
Eleventy assembles the content into web pages, GitHub Actions runs that process,
and GitHub Pages serves the finished website to readers.

Cloudflare handles the domain's address records (**DNS**) and runs a separate
small sign-in service. That service uses **OAuth**, a way to let the editor
access GitHub without collecting your GitHub password. Cloudflare does not
host the public blog in this setup.

### Maintainer quick reference

This is for members assigned technical maintenance, not a student-editor
checklist. Infrastructure and credential changes need approval.

| Area | Where to look |
| --- | --- |
| Content and uploads | `src/posts`, `src/pages`, `src/uploads` |
| Text, design, and socials | `src/_data/settings.json` |
| Layout and styles | `src/_includes`, `src/assets/site.css` |
| Editor fields and GitHub backend | `src/admin/config.yml` |
| Build and deployment workflow | `.github/workflows/pages.yml` |
| OAuth service and deployment settings | `oauth/worker.js`, `oauth/wrangler.jsonc` |

For local development, use Git, Node.js **22.12 or later**, and npm. In your
local copy of this repo, run:

```powershell
npm ci
npm run dev
```

Open the address printed by Eleventy. Edit source files, not generated `_site`
output. Production editor sign-in is deliberately restricted to the production
site, not localhost. Run `npm run check` for tests and the build, and
`npm run oauth:check` for a Worker deployment dry run.

Operational settings to preserve:

- Pages uses **GitHub Actions**, custom domain `www.money-minute.com`, and
  enforced HTTPS. Cloudflare's `www` CNAME points to `monadictrie.github.io`
  with **DNS-only** enabled and no repository path. This DNS alias is not an
  HTTP redirect. No apex-domain redirect is configured.
- Reserve the domain in Pages before pointing DNS at it, and check account-level
  TXT domain verification rather than assuming it is complete.
- The GitHub OAuth app is **Money Minute editor**, homepage
  `https://www.money-minute.com`, callback
  `https://cms-auth.money-minute.com/callback`. The Worker is
  `money-minute-cms-oauth`. Keep `CMS_ORIGIN`, `OAUTH_ORIGIN`, `GITHUB_REPO`,
  and Decap's `backend.base_url` consistent.
- Cloudflare encrypted bindings hold `GITHUB_CLIENT_ID`,
  `GITHUB_CLIENT_SECRET`, and `STATE_SECRET`. The client ID is public; the other
  two must stay secret. Generate `STATE_SECRET` randomly with at least 32
  characters. Use approved secure prompts such as
  `npx wrangler secret put STATE_SECRET --config oauth\wrangler.jsonc`, never
  secret values in source or command arguments. `.gitignore` does not erase
  already tracked secrets or history.
- The Worker checks repository Write permission and protects its login handoff.
  GitHub's requested `public_repo` permission is not limited to this repository.
  Revoke/re-authorise the app if reducing previously granted permissions.
- After approved Worker changes, use `npm run oauth:deploy` and verify real
  browser sign-in. The Pages workflow does **not** deploy Worker code.
  Wrangler's Cloudflare login is separate from student GitHub login; Workers
  access does not automatically grant ordinary DNS editing access.
- The main-branch rules require one approval, resolved threads, an up-to-date
  branch, and the **build** check. New changes dismiss stale approvals.
  Administrators have a maintenance bypass; normal editors do not.
- PRs are checked but not deployed. Main changes deploy automatically.
  The daily rebuild is scheduled for **06:17 UTC** and can be delayed; GitHub
  can disable schedules in inactive public repos after 60 days.
- A published post's filename determines its URL. Plan a redirect before
  renaming it. This setup has no automatic draft preview deployments.

Further reference:
[Decap workflow](https://decapcms.org/docs/editorial-workflows/),
[GitHub Pages domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site),
[Cloudflare secrets](https://developers.cloudflare.com/workers/configuration/secrets/).

## Check you are ready

You do not need to memorise tool names. Try answering these practical questions:

1. Where do you go to edit a post, and what account/access do you need?
2. What is the difference between saving a draft and publishing it?
3. Is an unpublished draft a safe place for private information? Why?
4. How do you ask for review, and what should your reviewer check?
5. Does moving an entry to Ready mean it has the required approval?
6. What should you do if feedback arrives or publishing is blocked?
7. After publishing, how do you check that readers can see the right result?
8. Why might a future-dated post not appear immediately?
9. How do you turn a placeholder social entry into an approved working link?
10. What information should you include when asking for help, and what must
    you leave out?

<details>
<summary>Suggested answers - try the questions first</summary>

1. Use the browser editor, with your approved GitHub account and an accepted
   invitation granting Write access.
2. Saving records work for review; publishing accepts an approved change and
   starts the process of updating the website.
3. No. Draft files and uploads are visible in this public GitHub project.
4. Move it to In review and contact your agreed reviewer. They check accuracy,
   sources, writing, links, images, privacy, and automatic checks.
5. No. The required GitHub approval and other checks are separate from Ready.
6. Improve the draft and save again, or ask the reviewer to explain the blocker.
   Do not turn off project rules.
7. Wait for the update to finish, then open the public page and check its text,
   links, images, and small-screen appearance.
8. It stays off the site until a rebuild on or after its date in UTC; updates
   are not an exact-time publishing service.
9. Agree on the real profile with the team, then add its full HTTPS address in
   Site settings > Text and design > Social links.
10. Give your steps, expected result, and safe error text. Leave out passwords,
    tokens, and the sign-in popup's return address.

</details>

**First task:** with your reviewer, make one small draft change, explain why
you made it, take it through review, and check the published result together.
