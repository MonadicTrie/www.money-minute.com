import { readFileSync } from "node:fs";
import { validateSettings } from "../../lib/content.js";

export default function () {
  const settings = JSON.parse(readFileSync(new URL("./settings.json", import.meta.url), "utf8"));
  return {
    ...validateSettings(settings),
    url: (process.env.PAGES_BASE_URL || "https://www.money-minute.com").replace(/\/$/u, ""),
    buildDate: new Date().toISOString(),
  };
}
