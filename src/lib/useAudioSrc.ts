import { useEffect, useState } from "react";
import { parseAudioUrl } from "../config/reciters";
import { isNative } from "./native/platform";

/**
 * Where to play `remote` from: an Android file, the service worker cache, or the remote URL.
 * `ready` is false until the lookup finished; `local` tells that the file is on the device (plays offline).
 */
export function useAudioSrc(remote: string) {
  const lookup = isNative() || (typeof navigator !== "undefined" && !navigator.onLine);
  const [resolved, setResolved] = useState<{ remote: string; url: string | null }>();
  useEffect(() => {
    setResolved(undefined);
    if (!lookup) return;
    const ref = parseAudioUrl(remote);
    if (!ref) {
      setResolved({ remote, url: null });
      return;
    }
    let live = true;
    void import("./audioCache")
      .then((m) => m.getAudioStore())
      .then((st) => st.resolve(ref.reciter, ref.s, ref.a))
      .catch(() => null)
      .then((url) => live && setResolved({ remote, url }));
    return () => {
      live = false;
    };
  }, [remote, lookup]);
  const result = lookup && resolved?.remote === remote ? resolved : undefined;
  return { src: result?.url ?? remote, ready: !lookup || result !== undefined, local: !!result?.url };
}
