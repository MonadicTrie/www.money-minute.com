import { EleventyHtmlBasePlugin } from "@11ty/eleventy";
import { publishedPosts } from "./lib/content.js";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
  eleventyConfig.amendLibrary("md", (markdown) => markdown.set({ html: false }));
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.addPassthroughCopy({
    "node_modules/decap-cms/dist/decap-cms.js": "admin/decap-cms.js",
    "node_modules/decap-cms/dist/*.decap-cms.js": "admin",
    "node_modules/decap-cms/dist/*.wasm": "admin",
    "node_modules/decap-cms/dist/decap-cms.js.LICENSE.txt": "admin/decap-cms.js.LICENSE.txt",
    "node_modules/decap-cms/dist/cms.css": "admin/cms.css",
  });
  eleventyConfig.addPassthroughCopy({ "src/uploads": "uploads" });
  eleventyConfig.addFilter("isoDate", (date) => new Date(date).toISOString());
  eleventyConfig.addFilter("readableDate", (date) =>
    new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(date)),
  );
  eleventyConfig.addFilter("absoluteUrl", (path, origin) => new URL(path, `${origin}/`).href);
  eleventyConfig.addCollection("posts", (collection) =>
    publishedPosts(collection.getFilteredByGlob("src/posts/*.md")),
  );
  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    pathPrefix: process.env.PAGES_PATH_PREFIX || "/",
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
  };
}
