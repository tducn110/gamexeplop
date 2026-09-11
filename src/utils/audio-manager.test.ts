import { describe, expect, it } from "vitest";
import {
  AudioManager,
  isBgmPlaybackEligible,
  isMusicActive,
  isSfxActive,
  type AudioPolicyState,
} from "./audio-manager";

describe("Audio Policy Predicates (referenced from 02-2048)", () => {
  const baseState: AudioPolicyState = {
    musicEnabled: true,
    sfxEnabled: true,
    parentMuted: false,
    hostPaused: false,
    documentHidden: false,
    unlocked: true,
  };

  it("evaluates music active state under all conditions", () => {
    expect(isMusicActive(baseState)).toBe(true);

    // Music disabled by user
    expect(isMusicActive({ ...baseState, musicEnabled: false })).toBe(false);

    // Parent/host muted
    expect(isMusicActive({ ...baseState, parentMuted: true })).toBe(false);

    // Host paused
    expect(isMusicActive({ ...baseState, hostPaused: true })).toBe(false);

    // Document hidden (background tab)
    expect(isMusicActive({ ...baseState, documentHidden: true })).toBe(false);

    // Not unlocked yet
    expect(isMusicActive({ ...baseState, unlocked: false })).toBe(false);
  });

  it("evaluates SFX active state under all conditions", () => {
    expect(isSfxActive(baseState)).toBe(true);

    // SFX disabled by user
    expect(isSfxActive({ ...baseState, sfxEnabled: false })).toBe(false);

    // Parent/host muted
    expect(isSfxActive({ ...baseState, parentMuted: true })).toBe(false);

    // Host paused
    expect(isSfxActive({ ...baseState, hostPaused: true })).toBe(false);

    // Document hidden
    expect(isSfxActive({ ...baseState, documentHidden: true })).toBe(false);
  });

  it("evaluates isBgmPlaybackEligible", () => {
    expect(isBgmPlaybackEligible(true, false, false)).toBe(true);
    expect(isBgmPlaybackEligible(false, false, false)).toBe(false);
    expect(isBgmPlaybackEligible(true, true, false)).toBe(false);
    expect(isBgmPlaybackEligible(true, false, true)).toBe(false);
    expect(isBgmPlaybackEligible(false, true, true)).toBe(false);
  });
});

describe("AudioManager lifecycle and mute authority", () => {
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

  it("handles host paused and visibility state transitions cleanly", () => {
    const audio = new AudioManager();
    audio.setHostPaused(true);
    audio.setVisibilityState("hidden");

    expect(audio.visibilityStateSnapshot).toBe("hidden");

    audio.setHostPaused(false);
    audio.setVisibilityState("visible");
    expect(audio.visibilityStateSnapshot).toBe("visible");
  });

  it("returns diagnostic snapshot", () => {
    const audio = new AudioManager();
    const diag = audio.getDiagnostics();
    expect(diag).toHaveProperty("unlockState");
    expect(diag).toHaveProperty("bgmPlaying");
    expect(diag).toHaveProperty("musicShouldPlay");
    expect(diag).toHaveProperty("visibilityState");
  });

  it("handles unlock cleanly in headless environment", async () => {
    const audio = new AudioManager();
    await expect(audio.unlockAudio()).resolves.toBeUndefined();
  });
});
