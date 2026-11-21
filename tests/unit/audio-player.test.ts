// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import AudioPlayer from "../../src/components/quiz/AudioPlayer";

vi.mock("../../src/lib/useAudioSrc", () => ({
  useAudioSrc: (src: string) => ({ src, ready: true, local: false }),
}));

let root: Root;
let container: HTMLDivElement;
let audio: HTMLAudioElement;
const unavailable = vi.fn();

beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root.render(
      createElement(AudioPlayer, {
        src: "/audio.mp3",
        autoplay: false,
        onUnavailable: unavailable,
      }),
    );
  });
  audio = container.querySelector("audio")!;
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  unavailable.mockClear();
});

async function event(name: string) {
  await act(async () => {
    audio.dispatchEvent(new Event(name));
  });
}

it("shows buffering during loading/waiting and clears it when playable", async () => {
  const status = container.querySelector('[role="status"]')!;
  expect(status.textContent).toBe("");
  await event("loadstart");
  expect(status.textContent).toBe("quiz.loading");
  await event("canplay");
  expect(status.textContent).toBe("");
  await event("waiting");
  expect(status.textContent).toBe("quiz.loading");
  await event("playing");
  expect(status.textContent).toBe("");
});

it("updates accessible progress and timestamps, including unknown duration", async () => {
  const progress = container.querySelector('[role="progressbar"]')!;
  expect(progress.getAttribute("aria-valuenow")).toBe("0");
  await event("timeupdate");
  expect(progress.getAttribute("aria-valuemax")).toBe("1");
  Object.defineProperty(audio, "duration", { configurable: true, value: 80 });
  audio.currentTime = 20;
  await event("timeupdate");
  expect(progress.getAttribute("aria-valuenow")).toBe("20");
  expect(progress.getAttribute("aria-valuemax")).toBe("80");
  expect(progress.firstElementChild?.getAttribute("style")).toContain("25%");
  expect(container.textContent).toContain("0:201:20");
});

it("replays from zero and handles rejected playback", async () => {
  audio.currentTime = 25;
  await event("timeupdate");
  const replay = container.querySelectorAll("button")[1]!;
  await act(async () => replay.click());
  expect(audio.currentTime).toBe(0);
  expect(audio.play).toHaveBeenCalledOnce();
  expect(container.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow")).toBe("0");
  vi.mocked(audio.play).mockRejectedValueOnce(new DOMException("unsupported", "NotSupportedError"));
  await act(async () => replay.click());
  expect(unavailable).toHaveBeenCalledOnce();
});

it("clears buffering and reports media errors", async () => {
  await event("waiting");
  await event("error");
  expect(container.querySelector('[role="status"]')?.textContent).toBe("");
  expect(unavailable).toHaveBeenCalledOnce();
});
