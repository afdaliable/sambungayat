import { Network } from "@capacitor/network";

/** True when the device is on mobile data (downloads may cost money). */
export async function onCellular(): Promise<boolean> {
  try {
    return (await Network.getStatus()).connectionType === "cellular";
  } catch {
    return false;
  }
}
