export default {
  layout: "page.njk",
  tags: ["pages"],
  eleventyComputed: {
    permalink: (data) => `/${data.page.fileSlug}/`,
  },
};
