import { SystemBars, SystemBarsStyle, SystemBarType } from "@capacitor/core";

/**
 * Android system bars follow the page. The header band is dark teal in both themes, so status bar icons
 * are always light. The navigation bar sits on the page background and follows the light/dark theme, except
 * on WebView < 140: there the WebView does not draw under the bars and the window colour (teal) shows.
 * Call once, only inside the native app.
 */
export function initChrome(): void {
  const chrome = Number(/Chrome\/(\d+)/.exec(navigator.userAgent)?.[1] ?? 999);
  const apply = () => {
    const dark = document.documentElement.classList.contains("dark") || chrome < 140;
    void SystemBars.setStyle({ style: SystemBarsStyle.Dark, bar: SystemBarType.StatusBar });
    void SystemBars.setStyle({
      style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
      bar: SystemBarType.NavigationBar,
    });
  };
  apply();
  new MutationObserver(apply).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
}
