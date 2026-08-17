import { describe, expect, it } from "vitest";
import { AudioManager } from "./audio-manager";

describe("AudioManager host mute", () => {
  it("preserves a user music mute across host mute and unmute", () => {
    const audio = new AudioManager();
    audio.setMusicMuted(true);
    audio.setHostMuted(true);
    audio.setHostMuted(false);

    expect(audio.musicMuted).toBe(true);
    expect(audio.hostMuted).toBe(false);
  });

  it("preserves a user sfx mute across host mute and unmute", () => {
    const audio = new AudioManager();
    audio.setSfxMuted(true);
    audio.setHostMuted(true);
    audio.setHostMuted(false);

    expect(audio.sfxMuted).toBe(true);
    expect(audio.hostMuted).toBe(false);
  });
});
