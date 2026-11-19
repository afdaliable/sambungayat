/** Share-intent URLs for the common platforms. Pure, so both Astro pages and React islands can use it. */
export function shareLinks(url: string, text: string) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  return [
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    },
    { id: "telegram", label: "Telegram", href: `https://t.me/share/url?url=${u}&text=${t}` },
    { id: "x", label: "X", href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    {
      id: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    },
  ] as const;
}
