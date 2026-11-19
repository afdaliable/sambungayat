// Class recap without a backend: students share a line with a machine-readable tag, the teacher pastes the chat.
// Tag format: SA<open>Name<close>score/total#code, where <open>/<close> are guillemets (built from code points to keep this file ASCII).
const OPEN = String.fromCharCode(0xab);
const CLOSE = String.fromCharCode(0xbb);

export type RecapRow = { name: string; score: number; total: number; code: string };

const TAG = new RegExp(`SA${OPEN}([^${CLOSE}\\n]{1,40})${CLOSE}(\\d+)/(\\d+)#([\\w-]+)`, "g");

const cleanName = (n: string) =>
  n
    .replace(new RegExp(`[${OPEN}${CLOSE}\\n]`, "g"), " ")
    .trim()
    .slice(0, 40);

export function recapTag(
  name: string,
  score: number,
  total: number,
  code: string,
  /** Fallback shown for an empty name (translate with "lib.recap.anonymous"). */
  anonymous = "Anonim",
): string {
  return `SA${OPEN}${cleanName(name) || anonymous}${CLOSE}${score}/${total}#${code.replace(/[^\w-]/g, "")}`;
}

/** Best score per (name, code); sorted by percentage then name. Ignores everything that is not a tag. */
export function parseRecap(text: string): RecapRow[] {
  const best = new Map<string, RecapRow>();
  for (const m of text.matchAll(TAG)) {
    const row = { name: m[1]!.trim(), score: Number(m[2]), total: Number(m[3]), code: m[4]! };
    if (!row.name || row.total === 0 || row.score > row.total) continue;
    const key = `${row.name.toLowerCase()}#${row.code}`;
    const old = best.get(key);
    if (!old || row.score / row.total > old.score / old.total) best.set(key, row);
  }
  return [...best.values()].sort(
    (a, b) => b.score / b.total - a.score / a.total || a.name.localeCompare(b.name),
  );
}
