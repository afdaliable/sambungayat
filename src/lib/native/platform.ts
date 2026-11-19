/** True inside the Capacitor Android app (the bridge injects `window.Capacitor`). Safe on the server. */
export const isNative = (): boolean =>
  typeof window !== "undefined" && !!(window as unknown as { Capacitor?: unknown }).Capacitor;

/** Fired by the Android Back button while a quiz is in progress; the quiz island answers with a confirmation. */
export const LEAVE_EVENT = "sa:leave-request";
