import { useEffect, useState } from "react";
import { parseAudioUrl } from "../config/reciters";
import { isNative } from "./native/platform";

/**
 * Where to play `remote` from: a saved file inside the Android app when there is one, otherwise the remote URL.
 * `ready` is false until the lookup finished; `local` tells that the file is on the device (plays offline).
 */
export function useAudioSrc(remote: string) {
  const [state, setState] = useState({ src: remote, ready: !isNative(), local: false });
  useEffect(() => {
    const ref = parseAudioUrl(remote);
    if (!isNative() || !ref) {
      setState({ src: remote, ready: true, local: false });
      return;
    }
    let live = true;
    setState({ src: remote, ready: false, local: false });
    void import("./audioCache")
      .then((m) => m.getAudioStore())
      .then((st) => st.resolve(ref.reciter, ref.s, ref.a))
      .catch(() => null)
      .then((u) => live && setState({ src: u ?? remote, ready: true, local: u !== null }));
    return () => {
      live = false;
    };
  }, [remote]);
  return state;
}
