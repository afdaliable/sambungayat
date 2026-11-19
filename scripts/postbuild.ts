// After `astro build`: (1) fill the CSP script hashes into dist/_headers, (2) enforce the JS budget for /kuis.
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

// 1. CSP hashes for every executable inline script (JSON-LD data blocks are not executed).
const hashes = new Set<string>();
const SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;
for (const f of await htmlFiles(DIST)) {
  const html = await readFile(f, "utf8");
  for (const m of html.matchAll(SCRIPT)) {
    const attrs = m[1] ?? "";
    const body = m[2] ?? "";
    if (/\bsrc=/.test(attrs) || /application\/ld\+json/.test(attrs) || body.trim() === "") continue;
    hashes.add(`'sha256-${createHash("sha256").update(body).digest("base64")}'`);
  }
}
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
