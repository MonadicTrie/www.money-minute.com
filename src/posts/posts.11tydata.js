export default {
  layout: "post.njk",
  eleventyComputed: {
    permalink: (data) =>
      new Date(data.date) > new Date() ? false : `/posts/${data.page.fileSlug}/`,
  },
};
