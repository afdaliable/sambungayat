import { isNative } from "./native/platform";

export type CardData = {
  site: string;
  title: string;
  score: number;
  total: number;
  date: string;
  /** Optional line under the date, e.g. the day streak. */
  extra?: string;
  footer: string;
  dir: "ltr" | "rtl";
};

const W = 1080;
const H = 1350;
const FONT = '"Sofia Sans Semi Condensed", system-ui, sans-serif';

/** Result card as PNG: same paper, teal band and brown stamp as the site. */
export async function renderCard(d: CardData): Promise<Blob> {
  try {
    await document.fonts.load(`700 80px ${FONT}`);
  } catch {
    /* system font is fine */
  }
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d")!;
  x.direction = d.dir;
  x.textAlign = "center";
  x.fillStyle = "#f6f0de";
  x.fillRect(0, 0, W, H);
  x.fillStyle = "#0d5750";
  x.fillRect(0, 0, W, 220);
  x.fillStyle = "#f6f0de";
  x.font = `700 84px ${FONT}`;
  x.fillText(d.site, W / 2, 140);

  x.fillStyle = "#0d5750";
  x.font = `600 56px ${FONT}`;
  x.fillText(d.title, W / 2, 400);

  // Stamp ring
  x.strokeStyle = "#7a4a1e";
  x.fillStyle = "#7a4a1e";
  x.lineWidth = 14;
  x.beginPath();
  x.arc(W / 2, 700, 230, 0, Math.PI * 2);
  x.stroke();
  x.lineWidth = 4;
  x.beginPath();
  x.arc(W / 2, 700, 208, 0, Math.PI * 2);
  x.stroke();
  x.font = `800 168px ${FONT}`;
  x.fillText(`${d.score}/${d.total}`, W / 2, 760);

  x.fillStyle = "#4a4a3f";
  x.font = `500 48px ${FONT}`;
  x.fillText(d.date, W / 2, 1010);
  if (d.extra) {
    x.fillStyle = "#0d5750";
    x.font = `700 52px ${FONT}`;
    x.fillText(d.extra, W / 2, 1090);
  }
  x.fillStyle = "#0d5750";
  x.fillRect(0, H - 130, W, 130);
  x.fillStyle = "#f6f0de";
  x.font = `600 50px ${FONT}`;
  x.fillText(d.footer, W / 2, H - 52);

  return new Promise((res, rej) =>
    c.toBlob((b) => (b ? res(b) : rej(new Error("png"))), "image/png"),
  );
}

const toBase64 = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1] ?? "");
    r.onerror = () => rej(r.error);
    r.readAsDataURL(b);
  });

/** Shares the card as an image. Falls back to a download where files cannot be shared. */
export async function shareCard(d: CardData, text: string): Promise<"shared" | "saved" | "failed"> {
  try {
    const blob = await renderCard(d);
    if (isNative()) {
      const [{ Filesystem, Directory }, { Share }] = await Promise.all([
        import("@capacitor/filesystem"),
        import("@capacitor/share"),
      ]);
      const { uri } = await Filesystem.writeFile({
        path: "sambungayat-hasil.png",
        data: await toBase64(blob),
        directory: Directory.Cache,
      });
      await Share.share({ text, files: [uri] });
      return "shared";
    }
    const file = new File([blob], "sambungayat-hasil.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return "shared";
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    return "saved";
  } catch (err) {
    // Dismissed share sheet is not an error worth reporting.
    if ((err as { name?: string }).name === "AbortError" || /cancel/i.test(String(err)))
      return "failed";
    return "failed";
  }
}
