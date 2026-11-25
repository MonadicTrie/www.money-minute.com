const palettes = new Set(["editorial", "dollar", "blue", "forest", "ocean", "plum"]);
const fonts = new Set(["sans", "serif"]);
const densities = new Set(["comfortable", "compact"]);

export function validateSettings(settings) {
  for (const field of ["title", "description", "heading", "intro"]) {
    if (typeof settings[field] !== "string" || !settings[field].trim()) {
      throw new Error(`Site settings: ${field} must be non-empty text.`);
    }
  }
  if (!palettes.has(settings.palette) || !fonts.has(settings.font) || !densities.has(settings.density)) {
    throw new Error("Site settings: select a supported palette, font, and density.");
  }
  if (settings.social_links !== undefined && !Array.isArray(settings.social_links)) {
    throw new Error("Site settings: social links must be a list.");
  }
  for (const social of settings.social_links || []) {
    if (!social || typeof social.label !== "string" || !social.label.trim()) {
      throw new Error("Site settings: each social link needs a label.");
    }
    for (const field of ["handle", "url"]) {
      if (social[field] !== undefined && typeof social[field] !== "string") {
        throw new Error(`Site settings: social ${field} must be text.`);
      }
    }
    if (social.url) {
      let url;
      try {
        url = new URL(social.url);
      } catch (error) {
        if (!(error instanceof TypeError)) throw error;
        throw new Error("Site settings: social URLs must be valid HTTPS links.");
      }
      if (url.protocol !== "https:" || url.username || url.password || /\s/u.test(social.url)) {
        throw new Error("Site settings: social URLs must use HTTPS without spaces or embedded credentials.");
      }
    }
  }
  return settings;
}

export function publishedPosts(posts, now = new Date()) {
  for (const post of posts) {
    for (const field of ["title", "description", "author"]) {
      if (typeof post.data[field] !== "string" || !post.data[field].trim()) {
        throw new Error(`${post.inputPath}: ${field} must be non-empty text.`);
      }
    }
    if (!post.data.date || Number.isNaN(new Date(post.data.date).getTime())) {
      throw new Error(`${post.inputPath}: date must be a valid publication date.`);
    }
    if (post.data.cover && !/^\/uploads\/[^?#]+$/u.test(post.data.cover)) {
      throw new Error(`${post.inputPath}: cover must refer to an uploaded image.`);
    }
  }
  return posts
    .filter((post) => new Date(post.data.date) <= now)
    .sort((a, b) => new Date(b.data.date) - new Date(a.data.date));
}
