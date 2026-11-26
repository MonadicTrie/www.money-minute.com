import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, readdir, rm, symlink, writeFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = fileURLToPath(new URL("../", import.meta.url));

test("built site publishes articles, preserves old URLs, safely renders content, and works under the Pages project path", async () => {
  const fixture = await mkdtemp(join(tmpdir(), "money-minute-build-"));
  try {
    for (const path of ["src", "lib", "eleventy.config.js", "package.json"]) {
      await cp(join(root, path), join(fixture, path), { recursive: true });
    }
    await symlink(join(root, "node_modules"), join(fixture, "node_modules"), "junction");
    await writeFile(join(fixture, "src", "posts", "published.md"), `---
title: 'Test <script>title</script>'
description: A test summary
author: Test author
date: 2000-01-01
cover: /uploads/test.png
cover_alt: Test image
---
# Test body

![Uploaded image](/uploads/test.png)

<script>alert("not executable")</script>
`);
    await writeFile(join(fixture, "src", "posts", "future.md"), `---
title: Future test
description: Not published
author: Test author
date: 2999-01-01
---
Not published yet.
`);
    const cli = join(root, "node_modules", "@11ty", "eleventy", "cmd.cjs");
    const build = (extraEnv = {}) => execFileSync(process.execPath, [cli, "--quiet"], {
      cwd: fixture,
      env: { ...process.env, PAGES_PATH_PREFIX: "", PAGES_BASE_URL: "", ...extraEnv },
      encoding: "utf8",
      stdio: "pipe",
    });
    build();
    const home = await readFile(join(fixture, "_site", "index.html"), "utf8");
    assert.match(home, /href="\/articles\/published\/"/u);
    assert.match(home, /Test &lt;script&gt;title&lt;\/script&gt;/u);
    assert.ok(!home.includes("Future test"));
    const article = await readFile(join(fixture, "_site", "articles", "published", "index.html"), "utf8");
    assert.match(article, /<h1>Test body<\/h1>/u);
    assert.match(article, /All articles/u);
    assert.ok(!article.includes('<script>alert("not executable")</script>'));
    await assert.rejects(access(join(fixture, "_site", "articles", "future", "index.html")));
    await assert.rejects(access(join(fixture, "_site", "posts", "future", "index.html")));
    const legacyUrl = await readFile(join(fixture, "_site", "posts", "published", "index.html"), "utf8");
    assert.match(legacyUrl, /http-equiv="refresh" content="0; url=\/articles\/published\/"/u);
    const articlesPage = await readFile(join(fixture, "_site", "articles", "index.html"), "utf8");
    assert.match(articlesPage, /href="\/articles\/published\/"/u);
    const feed = await readFile(join(fixture, "_site", "feed.xml"), "utf8");
    assert.match(feed, /https:\/\/www.money-minute.com\/articles\/published\//u);
    assert.ok(!feed.includes("Future test"));
    const sitemap = await readFile(join(fixture, "_site", "sitemap.xml"), "utf8");
    assert.ok(!sitemap.includes("future"));
    assert.ok(sitemap.includes("https://www.money-minute.com/articles/"));
    assert.ok(sitemap.includes("https://www.money-minute.com/articles/published/"));
    assert.ok(!sitemap.includes("/posts/"));
    const navigation = home.match(/<nav aria-label="Main navigation">([\s\S]*?)<\/nav>/u);
    assert.ok(navigation);
    assert.deepEqual(
      [...navigation[1].matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/gu)]
        .map(([, href, label]) => ({ href, label })),
      [
        { href: "/about/", label: "About" },
        { href: "/interviews/", label: "Interviews" },
        { href: "/articles/", label: "Articles" },
      ],
    );
    const cmsConfig = await readFile(join(fixture, "src", "admin", "config.yml"), "utf8");
    assert.match(cmsConfig, /label: Articles\s+label_singular: Article/u);
    assert.match(cmsConfig, /preview_path: "articles\/\{\{slug\}\}"/u);
    assert.match(cmsConfig, /label: Burgundy, coral and cream, value: editorial/u);
    assert.match(cmsConfig, /label: Dollar bill, green and ivory, value: dollar/u);
    assert.match(cmsConfig, /label: Blue, pale gold and ivory, value: blue/u);
    assert.doesNotMatch(cmsConfig, /label: Navy,/u);
    for (const slug of ["about", "resources", "contact"]) {
      const page = await readFile(join(fixture, "_site", slug, "index.html"), "utf8");
      assert.match(page, /<h1>[^<]+<\/h1>/u);
      assert.ok(sitemap.includes(`https://www.money-minute.com/${slug}/`));
    }
    const about = await readFile(join(fixture, "_site", "about", "index.html"), "utf8");
    assert.match(about, /<img[^>]+src="\/assets\/nano-anh-nguyen\.jpg"[^>]+alt="Nano Anh Nguyen"/u);
    assert.match(about, /<strong>Nano Anh Nguyen<\/strong> - Co founder and Financial Educator\./u);
    assert.match(about, /<img[^>]+src="\/assets\/anya-kapoor\.jpg"[^>]+alt="Anya Kapoor"/u);
    assert.match(about, /<strong>Anya Kapoor<\/strong> - Co founder and Financial Educator\./u);
    assert.match(about, /<img[^>]+src="\/assets\/nina-mattamana\.jpg"[^>]+alt="Nina Mattamana"/u);
    assert.match(about, /<strong>Nina Mattamana<\/strong> - Co founder and Financial Educator\./u);
    assert.ok(about.indexOf('alt="Nano Anh Nguyen"') < about.indexOf('alt="Anya Kapoor"'));
    assert.ok(about.indexOf('alt="Anya Kapoor"') < about.indexOf('alt="Nina Mattamana"'));
    assert.ok(!about.includes("Introduce the team's roles"));
    await access(join(fixture, "_site", "assets", "nano-anh-nguyen.jpg"));
    await access(join(fixture, "_site", "assets", "anya-kapoor.jpg"));
    await access(join(fixture, "_site", "assets", "nina-mattamana.jpg"));
    const interviews = await readFile(join(fixture, "_site", "interviews", "index.html"), "utf8");
    assert.match(interviews, /No interviews have been published yet\./u);
    assert.ok(sitemap.includes("https://www.money-minute.com/interviews/"));
    assert.match(home, /href="https:\/\/www\.instagram\.com\/money\._minute\/"/u);
    assert.match(home, /Instagram <span class="social-handle">@money\._minute<\/span>/u);
    assert.ok(!home.includes('class="placeholder-label"'));
    await access(join(fixture, "_site", "admin", "decap-cms.js"));
    await access(join(fixture, "_site", "admin", "decap-cms.js.LICENSE.txt"));
    const cmsAssets = await readdir(join(root, "node_modules", "decap-cms", "dist"));
    for (const asset of cmsAssets.filter((name) => name.endsWith(".decap-cms.js") || name.endsWith(".wasm"))) {
      await access(join(fixture, "_site", "admin", asset));
    }
    await access(join(fixture, "_site", "admin", "config.yml"));
    await access(join(fixture, "_site", "assets", "flower.svg"));

    const settingsPath = join(fixture, "src", "_data", "settings.json");
    const settings = JSON.parse(await readFile(settingsPath, "utf8"));
    await writeFile(settingsPath, JSON.stringify({
      ...settings,
      palette: "editorial",
      font: "serif",
      density: "compact",
      social_links: [{ label: "Example <team>", handle: "@sample", url: "https://example.com/student-project" }],
    }));
    await writeFile(join(fixture, "src", "pages", "about.md"), `---
title: Edited About
description: Edited page summary
---
## Edited student content
`);
    build({ PAGES_PATH_PREFIX: "/www.money-minute.com/", PAGES_BASE_URL: "https://monadictrie.github.io/www.money-minute.com" });
    const projectArticle = await readFile(join(fixture, "_site", "articles", "published", "index.html"), "utf8");
    assert.match(projectArticle, /href="\/www.money-minute.com\/assets\/site.css"/u);
    assert.match(projectArticle, /src="\/www.money-minute.com\/uploads\/test.png"/u);
    assert.match(projectArticle, /href="https:\/\/monadictrie.github.io\/www.money-minute.com\/articles\/published\/"/u);
    assert.match(projectArticle, /data-palette="editorial" data-font="serif" data-density="compact"/u);
    assert.match(projectArticle, /href="https:\/\/example.com\/student-project"/u);
    assert.match(projectArticle, /Example &lt;team&gt;/u);
    assert.ok(!projectArticle.includes('class="placeholder-label"'));
    const projectLegacyUrl = await readFile(join(fixture, "_site", "posts", "published", "index.html"), "utf8");
    assert.match(projectLegacyUrl, /http-equiv="refresh" content="0; url=\/www\.money-minute\.com\/articles\/published\/"/u);
    const editedPage = await readFile(join(fixture, "_site", "about", "index.html"), "utf8");
    assert.match(editedPage, /<h1>Edited About<\/h1>/u);
    assert.match(editedPage, /<h2>Edited student content<\/h2>/u);
    assert.match(editedPage, /href="\/www.money-minute.com\/about\/" aria-current="page"/u);
    const projectFeed = await readFile(join(fixture, "_site", "feed.xml"), "utf8");
    assert.match(projectFeed, /https:\/\/monadictrie.github.io\/www.money-minute.com\/articles\/published\//u);
  } finally {
    await rm(resolve(fixture), { recursive: true, force: true });
  }
});
