import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AnswerTranslation from "../../src/components/quiz/AnswerTranslation";
import type { Question } from "../../src/lib/quiz/types";
import messages from "../../locales/en/quiz.json";

const hooks = vi.hoisted(() => ({
  text: undefined as string | null | undefined,
  effect: undefined as (() => void) | undefined,
  lang: "en",
}));
vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  useState: () => [hooks.text, (value: string | null) => (hooks.text = value)],
  useEffect: (effect: () => void) => (hooks.effect = effect),
}));
vi.mock("../../src/lib/i18n/react", () => ({
  useI18n: () => ({
    lang: hooks.lang,
    t: (key: string) => messages[key.replace("quiz.", "") as keyof typeof messages],
  }),
}));

const q: Question = {
  id: "translation",
  mode: "lengkapi",
  prompt: {},
  source: { s: 1, a: 1 },
  options: [],
  correctKey: "word",
  answerTranslation: "Indonesian answer fixture",
};
const render = () => renderToStaticMarkup(createElement(AnswerTranslation, { q }));

beforeEach(() => {
  hooks.text = undefined;
  hooks.effect = undefined;
  hooks.lang = "en";
});
afterEach(() => vi.unstubAllGlobals());

describe("answer translation on an English page", () => {
  it("shows localized loading without leaking Indonesian text", () => {
    expect(render()).toContain("Loading translation...");
    expect(render()).not.toContain(q.answerTranslation);
  });

  it.each(["failure", "missing ayah", "empty ayah", "success"])(
    "handles %s after loading",
    async (scenario) => {
      q.source = {
        s: ["failure", "missing ayah", "empty ayah", "success"].indexOf(scenario) + 1,
        a: 1,
      };
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: scenario !== "failure",
          status: 503,
          json: async () =>
            scenario === "success"
              ? ["English answer fixture"]
              : scenario === "empty ayah"
                ? [""]
                : [],
        }),
      );
      render();
      hooks.effect?.();
      await vi.waitFor(() => expect(hooks.text).not.toBeUndefined());
      expect(render()).toContain(
        scenario === "success" ? "English answer fixture" : "Translation unavailable.",
      );
      expect(render()).not.toContain(q.answerTranslation);
    },
  );

  it("keeps the bundled translation on Indonesian pages", () => {
    hooks.lang = "id";
    expect(render()).toBe(q.answerTranslation);
  });
});
