import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, readdir, rm, symlink, writeFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = fileURLToPath(new URL("../", import.meta.url));

test("built site publishes posts, safely renders content, and works under the Pages project path", async () => {
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
    assert.match(home, /href="\/posts\/published\/"/u);
    assert.match(home, /Test &lt;script&gt;title&lt;\/script&gt;/u);
    assert.ok(!home.includes("Future test"));
    const post = await readFile(join(fixture, "_site", "posts", "published", "index.html"), "utf8");
    assert.match(post, /<h1>Test body<\/h1>/u);
    assert.ok(!post.includes('<script>alert("not executable")</script>'));
    await assert.rejects(access(join(fixture, "_site", "posts", "future", "index.html")));
    const feed = await readFile(join(fixture, "_site", "feed.xml"), "utf8");
    assert.match(feed, /https:\/\/www.money-minute.com\/posts\/published\//u);
    assert.ok(!feed.includes("Future test"));
    const sitemap = await readFile(join(fixture, "_site", "sitemap.xml"), "utf8");
    assert.ok(!sitemap.includes("future"));
    for (const slug of ["about", "resources", "contact"]) {
      const page = await readFile(join(fixture, "_site", slug, "index.html"), "utf8");
      assert.match(page, /Example content/u);
      assert.ok(home.includes(`href="/${slug}/"`));
      assert.ok(sitemap.includes(`https://www.money-minute.com/${slug}/`));
    }
    assert.match(home, /@your-project/u);
    assert.match(home, /class="placeholder-label">Placeholder/u);
    assert.ok(!home.includes('href="https://www.instagram.com'));
    await access(join(fixture, "_site", "admin", "decap-cms.js"));
    await access(join(fixture, "_site", "admin", "decap-cms.js.LICENSE.txt"));
    const cmsAssets = await readdir(join(root, "node_modules", "decap-cms", "dist"));
    for (const asset of cmsAssets.filter((name) => name.endsWith(".decap-cms.js") || name.endsWith(".wasm"))) {
      await access(join(fixture, "_site", "admin", asset));
    }
    await access(join(fixture, "_site", "admin", "config.yml"));

    const settingsPath = join(fixture, "src", "_data", "settings.json");
    const settings = JSON.parse(await readFile(settingsPath, "utf8"));
    await writeFile(settingsPath, JSON.stringify({
      ...settings,
      palette: "plum",
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
    const projectPost = await readFile(join(fixture, "_site", "posts", "published", "index.html"), "utf8");
    assert.match(projectPost, /href="\/www.money-minute.com\/assets\/site.css"/u);
    assert.match(projectPost, /src="\/www.money-minute.com\/uploads\/test.png"/u);
    assert.match(projectPost, /href="https:\/\/monadictrie.github.io\/www.money-minute.com\/posts\/published\/"/u);
    assert.match(projectPost, /data-palette="plum" data-font="serif" data-density="compact"/u);
    assert.match(projectPost, /href="https:\/\/example.com\/student-project"/u);
    assert.match(projectPost, /Example &lt;team&gt;/u);
    assert.ok(!projectPost.includes('class="placeholder-label"'));
    const editedPage = await readFile(join(fixture, "_site", "about", "index.html"), "utf8");
    assert.match(editedPage, /<h1>Edited About<\/h1>/u);
    assert.match(editedPage, /<h2>Edited student content<\/h2>/u);
    assert.match(editedPage, /href="\/www.money-minute.com\/about\/" aria-current="page"/u);
    const projectFeed = await readFile(join(fixture, "_site", "feed.xml"), "utf8");
    assert.match(projectFeed, /https:\/\/monadictrie.github.io\/www.money-minute.com\/posts\/published\//u);
  } finally {
    await rm(resolve(fixture), { recursive: true, force: true });
  }
});
