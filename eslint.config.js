import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";

export default [
  {
    ignores: [
      "dist/",
      ".wrangler/",
      "android/",
      "ios/",
      "public/",
      ".env",
      ".astro/",
      "node_modules/",
      "public/data/",
      "playwright-report/",
      "test-results/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  { rules: { "@typescript-eslint/no-explicit-any": "error" } },
];
