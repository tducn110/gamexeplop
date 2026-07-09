export interface CharacterAsset {
  id: string;
  name: string;
  src: string;
}

export const CHARACTER_ASSETS: CharacterAsset[] = [
  { id: "banhchung-idle", name: "Banh Chung", src: "/Characters/banhchung/01_idle_smile.png" },
  { id: "banhchung-wave", name: "Banh Chung", src: "/Characters/banhchung/02_wave.png" },
  { id: "banhchung-laugh", name: "Banh Chung", src: "/Characters/banhchung/03_excited_laugh.png" },
  { id: "banhchung-wink", name: "Banh Chung", src: "/Characters/banhchung/04_wink.png" },
  { id: "banhchung-pray", name: "Banh Chung", src: "/Characters/banhchung/05_calm_pray.png" },
  { id: "banhchung-surprised", name: "Banh Chung", src: "/Characters/banhchung/06_surprised.png" },
  { id: "banhchung-cheer", name: "Banh Chung", src: "/Characters/banhchung/07_cheer.png" },
  { id: "banhchung-sad", name: "Banh Chung", src: "/Characters/banhchung/08_sad.png" },
  { id: "banhchung-angry", name: "Banh Chung", src: "/Characters/banhchung/09_angry.png" },
  { id: "banhchung-cool", name: "Banh Chung", src: "/Characters/banhchung/10_cool_sunglasses.png" },
  { id: "banhchung-love", name: "Banh Chung", src: "/Characters/banhchung/11_love_heart.png" },
  { id: "banhchung-run", name: "Banh Chung", src: "/Characters/banhchung/12_run.png" },
  { id: "banhchung-sleepy", name: "Banh Chung", src: "/Characters/banhchung/13_sleepy.png" },
  { id: "banhchung-search", name: "Banh Chung", src: "/Characters/banhchung/14_search_magnifier.png" },
  { id: "banhchung-confused", name: "Banh Chung", src: "/Characters/banhchung/15_confused_question.png" },
];

export const DEFAULT_CHARACTER_ASSET = CHARACTER_ASSETS[0];

export function pickRandomCharacterAsset(currentId?: string): CharacterAsset {
  const candidates = CHARACTER_ASSETS.filter((asset) => asset.id !== currentId);
  const pool = candidates.length ? candidates : CHARACTER_ASSETS;
  return pool[Math.floor(Math.random() * pool.length)] ?? DEFAULT_CHARACTER_ASSET;
}
