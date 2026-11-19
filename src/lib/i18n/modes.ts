import type { QuizMode } from "../quiz/types";
import { t, type Dict } from "./core";

/** Localized title and description of a quiz mode. `dict` must include the "lib" namespace. */
export function modeText(dict: Dict, id: QuizMode): { title: string; desc: string } {
  return { title: t(dict, `lib.mode.${id}.title`), desc: t(dict, `lib.mode.${id}.desc`) };
}
