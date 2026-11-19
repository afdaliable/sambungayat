import { readFile } from "node:fs/promises";
import { createLoader, type QuranData } from "../../src/lib/quran/loader";
import type { Scope } from "../../src/lib/quiz/types";

// Reads the real built data (public/data/v1), exercising the real loader.
export const diskLoader = createLoader(async (path) =>
  JSON.parse(await readFile(`public/data/v1/${path}`, "utf8")),
);

export const ALL: Scope = { kind: "range", from: 1, to: 114 };
let allData: Promise<QuranData> | undefined;
export const loadAll = () => (allData ??= diskLoader.load(ALL));
