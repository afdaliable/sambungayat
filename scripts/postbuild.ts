// After `astro build`: fill CSP hashes, enforce the quiz JS budget and keep static pages framework-free.
import { PREFIXED_LANGS } from "../src/lib/i18n/core";
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const DIST = "dist";
const BUDGET_GZIP_BYTES = 120 * 1024;

async function htmlFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== "data") out.push(...(await htmlFiles(p)));
    } else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

// 1. CSP hashes for every executable inline script (JSON data blocks such as JSON-LD are not executed).
const hashes = new Set<string>();
const SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;
const pages = await htmlFiles(DIST);
for (const f of pages) {
  const html = await readFile(f, "utf8");
  for (const m of html.matchAll(SCRIPT)) {
    const attrs = m[1] ?? "";
    const body = m[2] ?? "";
    if (/\bsrc=/.test(attrs) || /application\/(?:ld\+)?json/.test(attrs) || body.trim() === "")
      continue;
    hashes.add(`'sha256-${createHash("sha256").update(body).digest("base64")}'`);
  }
}

const staticPages = pages.filter((f) => {
  const path = f.slice(DIST.length + 1);
  const prefix = PREFIXED_LANGS.find((lang) => path.startsWith(`${lang}/`));
  const route = prefix ? path.slice(prefix.length + 1) : path;
  return /^(?:index\.html|(?:surah|juz|blog)(?:\/.*)?\.html)$/.test(route);
});
for (const f of staticPages) {
  const html = await readFile(f, "utf8");
  if (/<astro-island\b|renderer-url=|\/_astro\/(?:react|client)\.[^"\s]+\.js/.test(html)) {
    throw new Error(`Static page loads framework JS: ${f}`);
  }
}
console.log(
  `postbuild: ${staticPages.length} home/surah/juz/blog pages have no framework islands or React/client chunks`,
);
// Optional product analytics (Plausible-compatible): allow its origin in the CSP only when configured.
const analyticsSrc = process.env.PUBLIC_PLAUSIBLE_DOMAIN
  ? process.env.PUBLIC_PLAUSIBLE_SRC || "https://plausible.io/js/script.js"
  : "";
const analyticsHost = analyticsSrc ? ` ${new URL(analyticsSrc).origin}` : "";
const headers = await readFile(join(DIST, "_headers"), "utf8");
if (!headers.includes("__SCRIPT_HASHES__"))
  throw new Error("dist/_headers has no __SCRIPT_HASHES__ placeholder");
await writeFile(
  join(DIST, "_headers"),
  headers
    .replace("__SCRIPT_HASHES__", [...hashes].join(" "))
    .replaceAll("__ANALYTICS_HOST__", analyticsHost),
);
const longest = Math.max(
  ...(await readFile(join(DIST, "_headers"), "utf8")).split("\n").map((l) => l.length),
);
if (longest > 2000)
  throw new Error(`dist/_headers has a ${longest}-char line; Cloudflare Pages allows 2000`);
console.log(
  `postbuild: _headers longest line ${longest} chars; CSP has ${hashes.size} inline script hashes`,
);

// 2. JS budget: every script a quiz page loads (modulepreload + module imports of its island chunks), per language.
for (const page of ["kuis.html", ...PREFIXED_LANGS.map((l) => `${l}/kuis.html`)]) {
  const html = await readFile(join(DIST, page), "utf8");
  const seen = new Set<string>();
  const queue = [...html.matchAll(/["'(](\/_astro\/[^"')\s]+\.js)/g)].map((m) => m[1]!);
  while (queue.length) {
    const url = queue.pop()!;
    if (seen.has(url)) continue;
    seen.add(url);
    const src = await readFile(join(DIST, url), "utf8");
    for (const m of src.matchAll(/["'`]\.\/([^"'`]+\.js)["'`]/g)) queue.push(`/_astro/${m[1]}`);
  }
  let total = 0;
  for (const url of seen) total += gzipSync(await readFile(join(DIST, url))).length;
  console.log(
    `postbuild: /${page.replace(/\.html$/, "")} JS ${(total / 1024).toFixed(1)} KB gzip across ${seen.size} files (budget ${BUDGET_GZIP_BYTES / 1024} KB)`,
  );
  if (total > BUDGET_GZIP_BYTES) throw new Error(`JS budget exceeded for /${page}`);
}
