import { useEffect } from "react";
import { audioManager } from "../utils/audio-manager";

/** Syncs sfxMuted setting to the audio manager each time it changes. */
export function useGameSound(sfxMuted: boolean) {
  useEffect(() => {
    audioManager.setSfxMuted(sfxMuted);
  }, [sfxMuted]);
}
