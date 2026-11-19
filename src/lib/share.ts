import { isNative } from "./native/platform";

/** True when a share sheet exists: the Android app (Share plugin) or a browser with Web Share. */
export const canShare = () => isNative() || typeof navigator.share === "function";

/** Native share sheet in the app, Web Share API in browsers, clipboard as the last resort. */
export async function shareText(
  text: string,
  url?: string,
): Promise<"shared" | "copied" | "failed"> {
  try {
    if (isNative()) {
      const { Share } = await import("@capacitor/share");
      await Share.share({ text, ...(url ? { url } : {}) });
      return "shared";
    }
    if (typeof navigator.share === "function") {
      await navigator.share({ text, ...(url ? { url } : {}) });
      return "shared";
    }
  } catch (err) {
    // The user dismissed the sheet (web: AbortError, Capacitor: "Share canceled").
    if ((err as { name?: string }).name === "AbortError" || /cancel/i.test(String(err))) return "failed";
  }
  try {
    await navigator.clipboard.writeText(url ? `${text} ${url}` : text);
    return "copied";
  } catch {
    return "failed";
  }
}
