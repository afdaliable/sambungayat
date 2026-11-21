import { LocalNotifications } from "@capacitor/local-notifications";
import { readJson, writeJson } from "../storage";

export type Reminder = { on: boolean; time: string };

const ID = 1;
export const getReminder = (): Reminder =>
  readJson<Reminder>("reminder", { on: false, time: "19:00" });

/** Daily local notification at `time` (device clock). Returns false when the permission is refused. */
export async function enableReminder(time: string, title: string, body: string): Promise<boolean> {
  const perm = await LocalNotifications.requestPermissions();
  if (perm.display !== "granted") return false;
  const [hour, minute] = time.split(":").map(Number);
  await LocalNotifications.cancel({ notifications: [{ id: ID }] });
  await LocalNotifications.schedule({
    notifications: [
      {
        id: ID,
        title,
        body,
        smallIcon: "ic_stat_sambungayat",
        isExactNotification: false, // default true would send the user to the exact-alarm settings screen
        schedule: { on: { hour: hour ?? 19, minute: minute ?? 0 }, allowWhileIdle: true },
      },
    ],
  });
  writeJson("reminder", { on: true, time });
  return true;
}

export async function disableReminder(): Promise<void> {
  await LocalNotifications.cancel({ notifications: [{ id: ID }] });
  writeJson("reminder", { ...getReminder(), on: false });
}
