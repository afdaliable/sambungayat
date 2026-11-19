import { SCHEMA_VERSION } from "./index";

/** One step copies `sa:v<from>:*` into `sa:v<to>:*` in the new shape. Old keys stay until a later cleanup. */
export interface Migration {
  from: number;
  to: number;
  run(store: Storage): void;
}

/** None yet: v1 is the only shape. Not called anywhere until a v2 exists. */
export const MIGRATIONS: Migration[] = [];

const MARKER = "sa:schema";

/** Runs pending steps up to `target`, remembers the reached version, and returns it. */
export function migrateStorage(
  store: Storage,
  steps: Migration[] = MIGRATIONS,
  target: number = SCHEMA_VERSION,
): number {
  let version = Number(store.getItem(MARKER)) || 1;
  for (let step = steps.find((m) => m.from === version); step && step.to <= target; ) {
    step.run(store);
    version = step.to;
    store.setItem(MARKER, String(version));
    step = steps.find((m) => m.from === version);
  }
  return version;
}
