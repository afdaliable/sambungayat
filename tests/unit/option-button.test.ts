import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import OptionButton from "../../src/components/quiz/OptionButton";

it("isolates the surah number and Latin name together inside an Arabic RTL option", () => {
  const nameAr = "\u0627\u0644\u0642\u0627\u0631\u0639\u0629";
  const markup = renderToStaticMarkup(
    createElement(
      "div",
      { lang: "ar", dir: "rtl" },
      createElement(OptionButton, {
        option: { key: "101", label: { type: "surah", n: 101, nameLatin: "Al-Qari'ah", nameAr } },
        number: 1,
        state: "idle",
        disabled: false,
        onSelect: () => {},
      }),
    ),
  );

  expect(markup).toContain('<bdi dir="ltr">101. Al-Qari&#x27;ah</bdi>');
  expect(markup).toMatch(new RegExp(`<span lang="ar" dir="rtl"[^>]*>${nameAr}</span>`));
});
