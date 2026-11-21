import { App } from "@capacitor/app";
import { LANG_CODES } from "../i18n/core";

const HOSTS = new Set(["sambungayat.com", "www.sambungayat.com"]);
const LANG = `(?:/(?:${LANG_CODES.join("|")}))?`;
const PAGES = new RegExp(
  `^${LANG}/(?:kuis|harian|guru|rekap|riwayat|panduan|faq|tentang|privasi|blog|blog/[a-z0-9-]{1,80}|kontak|juz|surah|juz/\\d{1,2}|surah/[a-z0-9-]{1,40})$`,
);
const LANG_HOME = new RegExp(`^/(?:${LANG_CODES.join("|")})$`);

/**
 * Maps a link someone tapped (teacher link, daily share, result share) to the page bundled in the app,
 * or null when it is not ours. Query and hash are kept untouched: they carry the quiz config and seed,
 * so the app builds the same quiz as the web. Unknown paths on our hosts open the home page.
 */
export function toAppPath(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || !HOSTS.has(u.hostname) || u.port || u.username || u.password) {
    return null;
  }
  const path = u.pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return "/";
  if (LANG_HOME.test(path)) return `${path}.html`;
  if (!PAGES.test(path)) return "/";
  return `${path}.html${u.search}${u.hash}`;
}

const LAUNCH_DONE = "sa:launch-handled";

/**
 * Opens a tapped link inside the app. Call on every page load, only inside the native app.
 * getLaunchUrl() keeps returning the link that started the app, so it is handled once per app start
 * (sessionStorage lives as long as the WebView), otherwise every page change would reopen it.
 */
export function initLinks(): void {
  const open = (url: string) => {
    const to = toAppPath(url);
    if (to) location.replace(to);
  };
  void App.addListener("appUrlOpen", (e) => open(e.url));
  let done = false;
  try {
    done = !!sessionStorage.getItem(LAUNCH_DONE);
    sessionStorage.setItem(LAUNCH_DONE, "1");
  } catch {
    /* no sessionStorage: handle it anyway */
  }
  if (!done) void App.getLaunchUrl().then((l) => l?.url && open(l.url));
}
