import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Blog articles live in /content/blog (outside src, so the ASCII-only rule for src does not apply to prose).
const blog = defineCollection({
  loader: glob({ pattern: "*.md", base: "./content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    /** Draft articles are not built: use for text that still needs a content review. */
    draft: z.boolean().default(false),
    /** Slug of a quiz page the article points to (ctaHref), shown as a button under the text. */
    ctaHref: z.string().default("/kuis"),
    ctaLabel: z.string().default("Coba kuisnya"),
  }),
});

export const collections = { blog };
