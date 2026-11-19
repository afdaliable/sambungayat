import { App } from "@capacitor/app";
import { LEAVE_EVENT } from "./platform";

/** Leave the current page: previous page if there is one, otherwise close the app. */
export function goBack(): void {
  if (history.length > 1) history.back();
  else void App.exitApp();
}

/** Registers the hardware Back button. Call once, only inside the native app. */
export function initBack(): void {
  void App.addListener("backButton", () => {
    const dialog = document.querySelector<HTMLDialogElement>("dialog[open]");
    if (dialog) return dialog.close();
    const lang = document.querySelector<HTMLDetailsElement>("details#lang-switch[open]");
    if (lang) return void (lang.open = false);
    if (document.documentElement.dataset.quizBusy) {
      window.dispatchEvent(new Event(LEAVE_EVENT));
      return;
    }
    goBack();
  });
}
