import test from "node:test";
import assert from "node:assert/strict";
import { publishedPosts, validateSettings } from "../lib/content.js";

function post(date, extra = {}) {
  return { inputPath: "src/posts/test.md", data: { title: "A test", description: "Summary", author: "Test author", date, ...extra } };
}

test("published posts exclude future dates and sort newest first, including the publication boundary", () => {
  const older = post("2026-11-21");
  const today = post("2026-11-23");
  const future = post("2026-11-24");
  assert.deepEqual(publishedPosts([older, future, today], new Date("2026-11-23T00:00:00Z")), [today, older]);
});

test("invalid post data fails the build rather than disappearing silently", () => {
  assert.throws(() => publishedPosts([post("invalid")]), /date must be a valid/u);
  assert.throws(() => publishedPosts([post("2026-11-23", { title: "" })]), /title/u);
  assert.throws(() => publishedPosts([post("2026-11-23", { cover: "javascript:alert(1)" })]), /uploaded image/u);
});

test("design settings reject unsupported values and empty required text", () => {
  const settings = { title: "Blog", description: "Description", heading: "Heading", intro: "Introduction", palette: "forest", font: "sans", density: "compact" };
  assert.equal(validateSettings(settings), settings);
  assert.throws(() => validateSettings({ ...settings, palette: 'forest" onclick="alert(1)' }), /supported/u);
  assert.throws(() => validateSettings({ ...settings, intro: "" }), /intro/u);
});

test("social settings accept unlinked placeholder handles and real HTTPS profile links", () => {
  const settings = { title: "Blog", description: "Description", heading: "Heading", intro: "Introduction", palette: "forest", font: "sans", density: "compact" };
  assert.doesNotThrow(() => validateSettings({
    ...settings,
    social_links: [
      { label: "Instagram", handle: "@your-project", url: "" },
      { label: "Project", url: "https://example.com/student-project" },
    ],
  }));
});

test("social settings reject unsafe URLs and malformed entries", () => {
  const settings = { title: "Blog", description: "Description", heading: "Heading", intro: "Introduction", palette: "forest", font: "sans", density: "compact" };
  assert.throws(() => validateSettings({ ...settings, social_links: {} }), /list/u);
  assert.throws(() => validateSettings({ ...settings, social_links: [{ label: "" }] }), /label/u);
  assert.throws(() => validateSettings({ ...settings, social_links: [{ label: "Profile", url: 123 }] }), /text/u);
  for (const url of ["javascript:alert(1)", "http://example.com", "not-a-url", "https://user:password@example.com", "https://example.com/profile name"]) {
    assert.throws(() => validateSettings({ ...settings, social_links: [{ label: "Profile", url }] }), /social URLs/u);
  }
});
