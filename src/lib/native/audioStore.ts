import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { FileTransfer } from "@capacitor/file-transfer";
import { audioUrl, type ReciterId } from "../../config/reciters";
import type { AudioStore, Ref } from "../audioCache";
import { downloadRefs } from "../audioCache";

const ROOT = "audio";
const dir = Directory.Data;
const name = (s: number, a: number) =>
  `${String(s).padStart(3, "0")}${String(a).padStart(3, "0")}.mp3`;
const path = (r: ReciterId, s: number, a: number) => `${ROOT}/${r}/${name(s, a)}`;

async function stored(reciter: ReciterId): Promise<Set<string>> {
  try {
    const { files } = await Filesystem.readdir({ path: `${ROOT}/${reciter}`, directory: dir });
    return new Set(files.map((f) => f.name));
  } catch {
    return new Set(); // folder not created yet
  }
}

/** Audio saved as plain files in app-private storage (removed with the app, no permission needed). */
export const nativeAudioStore: AudioStore = {
  supported: () => true,
  async count(reciter, refs: Ref[]) {
    const have = await stored(reciter);
    return refs.filter((r) => have.has(name(r.s, r.a))).length;
  },
  async download(reciter, refs, onProgress, signal) {
    const have = await stored(reciter);
    return downloadRefs(
      refs,
      async (r) => {
        signal?.throwIfAborted();
        if (!have.has(name(r.s, r.a))) {
          const p = path(reciter, r.s, r.a);
          try {
            await Filesystem.mkdir({
              path: `${ROOT}/${reciter}`,
              directory: dir,
              recursive: true,
            }).catch(() => {});
            const { uri } = await Filesystem.getUri({ path: p, directory: dir });
            await FileTransfer.downloadFile({ url: audioUrl(reciter, r.s, r.a), path: uri });
          } catch (error) {
            // a failed download may leave a partial file that would count as stored
            await Filesystem.deleteFile({ path: p, directory: dir }).catch(() => {});
            throw error;
          }
        }
      },
      onProgress,
      signal,
    );
  },
  async clear() {
    await Filesystem.rmdir({ path: ROOT, directory: dir, recursive: true }).catch(() => {});
  },
  async resolve(reciter, s, a) {
    try {
      const { uri } = await Filesystem.stat({ path: path(reciter, s, a), directory: dir });
      return Capacitor.convertFileSrc(uri);
    } catch {
      return null;
    }
  },
};
