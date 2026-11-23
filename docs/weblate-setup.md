# Setting up Weblate for the interface texts (maintainers)

Goal: let native speakers review and translate `locales/` in the browser, without Git. Hosted Weblate offers free hosting for open source projects (apply at hosted.weblate.org; check their current terms).

## Component layout

The files are flat JSON, one file per namespace and language. Create **one component per namespace**:

| Setting                        | Value                                                                    |
| ------------------------------ | ------------------------------------------------------------------------ |
| Repository                     | `https://github.com/afdaliable/sambungayat` (branch `main`)              |
| File mask                      | `locales/*/<namespace>.json`                                             |
| Monolingual base language file | `locales/id/<namespace>.json`                                            |
| File format                    | JSON file (flat key/value)                                               |
| Source language                | Indonesian (`id`)                                                        |
| New translations               | off (the 12 languages are fixed; adding one needs code, see `CLAUDE.md`) |

Namespaces: `about`, `common`, `contact`, `faq`, `guide`, `home`, `lib`, `pages`, `privacy`, `quiz`, `settings`, `teacher`.

## Rules to enforce in Weblate

- Keep keys and `{placeholders}` unchanged. Add a "placeholders" check as a mandatory (blocking) check.
- Plural keys use suffixes (`x.one`, `x.other`, and `few`/`many` where the language needs them). Weblate shows them as separate strings; leave the suffix as is.
- Languages with right-to-left text (`ar`, `ur`) need a visual check on the site after merging.
- Do not add Quran translations here: those come from the data pipeline.

## Flow

1. Weblate pushes translations as pull requests to the repository (set "Push on commit" off and use the pull request integration), so CI (`tests/unit/i18n.test.ts`) runs before anything reaches `main`.
2. A maintainer merges after CI is green. Credit the translator (Weblate keeps the author).
3. Mention the translation tool in `CONTRIBUTING.md` and `docs/translation-review-guide.md` once it is live.

## Alternative: Crowdin

`crowdin.yml` at the repository root maps `locales/id/*.json` to `locales/<code>/<same file>`. Create a Crowdin project (free for open source on request), set the source language to Indonesian, connect the GitHub integration so that it opens pull requests, and keep CI (`tests/unit/i18n.test.ts`) as the gate. Do not enable both tools on the same files.

## Current setup (hosted.weblate.org, project `sambung-ayat`)

- Project: `https://hosted.weblate.org/projects/sambung-ayat/` (trial started 2026-11-23, 14 days; Libre approval has to be requested before it ends).
- Component `about` was created by hand (repository `https://github.com/afdaliable/sambungayat.git`, branch `main`, JSON file, mask `locales/*/about.json`, base `locales/id/about.json`, indentation 2, "Edit base file" off). The other eleven came from the **Component discovery** add-on (regex `locales/(?P<language>[^/.]*)/(?P<component>[^/]*)\.json`, base `locales/id/{{ component }}.json`); they share the `about` clone through `weblate://sambung-ayat/about`.
- Project workflow: flag `python-brace-format` and the enforced check "Python brace format", so a changed `{placeholder}` cannot be dismissed. Adding new translations: disabled.
- Still manual: switch the VCS of `about` to "GitHub pull request" (Weblate GitHub App) so translations arrive as pull requests, then "Request approval" for Libre hosting.
