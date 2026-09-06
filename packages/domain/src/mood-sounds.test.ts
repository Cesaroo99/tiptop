import { describe, expect, it } from "vitest";
import { isMoodSoundKey, moodSoundSrc } from "./mood-sounds";

describe("mood sounds", () => {
  it("n’accepte que les clés connues", () => {
    expect(isMoodSoundKey("pulse")).toBe(true);
    expect(isMoodSoundKey("tiktok")).toBe(false);
    expect(moodSoundSrc("glow")).toBe("/seed/moods/sounds/glow.wav");
    expect(moodSoundSrc("original")).toBeNull();
  });
});
