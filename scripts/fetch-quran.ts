import { access, mkdir, readFile, writeFile } from "node:fs/promises";

const BASE = "https://api.alquran.cloud/v1";
const FILES: Record<string, string> = {
  "quran-uthmani.json": `${BASE}/quran/quran-uthmani`,
  "id.indonesian.json": `${BASE}/quran/id.indonesian`,
  "meta.json": `${BASE}/meta`,
  "editions-id.json": `${BASE}/edition?language=id&type=translation`,
};

async function get(url: string): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const json = JSON.parse(text) as { code?: number };
      if (json.code !== 200) throw new Error(`API code ${json.code}`);
      return text;
    } catch (err) {
      lastErr = err;
      console.warn(`attempt ${attempt} failed for ${url}: ${String(err)}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    }
  }
  throw new Error(`giving up on ${url}: ${String(lastErr)}`);
}

// Extra translation editions per language (data/translations.json). `--translations-only` skips the base files.
const translations = JSON.parse(await readFile("data/translations.json", "utf8")) as Record<
  string,
  { edition: string }
>;
const files: Record<string, string> = process.argv.includes("--translations-only")
  ? {}
  : { ...FILES };
for (const { edition } of Object.values(translations))
  files[`tr.${edition}.json`] = `${BASE}/quran/${edition}`;

// `--missing-only` downloads just the files that are not on disk yet. Translations are not committed (their licence
// terms are the translators', see docs/data-licenses.md), so a fresh clone and CI run this before `data:build`.
const missingOnly = process.argv.includes("--missing-only");
const exists = (f: string) =>
  access(f).then(
    () => true,
    () => false,
  );

await mkdir("data/raw", { recursive: true });
for (const [name, url] of Object.entries(files)) {
  if (missingOnly && (await exists(`data/raw/${name}`))) continue;
  await writeFile(`data/raw/${name}`, await get(url));
  console.log(`saved data/raw/${name}`);
}
