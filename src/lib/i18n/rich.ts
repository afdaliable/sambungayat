const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Inline link as an HTML string, for `rich()` placeholders. */
export const link = (href: string, label: string, cls = "underline") =>
  `<a class="${cls}" href="${esc(href).replace(/"/g, "&quot;")}">${esc(label)}</a>`;

/**
 * Text with inline markup for set:html. The template (from a locale file) is escaped; placeholders such as
 * {settings} are replaced with the given HTML strings, which must already be safe (use link()).
 */
export function rich(template: string, html: Record<string, string>): string {
  return esc(template).replace(/\{(\w+)\}/g, (m, k: string) => html[k] ?? m);
}
