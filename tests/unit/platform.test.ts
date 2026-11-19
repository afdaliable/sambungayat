import { afterEach, describe, expect, it, vi } from "vitest";
import { isNative } from "../../src/lib/native/platform";

describe("isNative", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is false without a window (server) and in a plain browser", () => {
    expect(isNative()).toBe(false);
    vi.stubGlobal("window", {});
    expect(isNative()).toBe(false);
  });

  it("is true once the Capacitor bridge exists", () => {
    vi.stubGlobal("window", { Capacitor: {} });
    expect(isNative()).toBe(true);
  });
});
