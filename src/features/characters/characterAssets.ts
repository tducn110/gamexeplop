export interface CharacterAsset {
  id: string;
  name: string;
  src: string;
}

export const CHARACTER_ASSETS: CharacterAsset[] = [
  { id: "banhchung-idle", name: "Banh Chung", src: "/Characters/banhchung/01_idle_smile.webp" },
  { id: "banhchung-wave", name: "Banh Chung", src: "/Characters/banhchung/02_wave.webp" },
  { id: "banhchung-laugh", name: "Banh Chung", src: "/Characters/banhchung/03_excited_laugh.webp" },
  { id: "banhchung-wink", name: "Banh Chung", src: "/Characters/banhchung/04_wink.webp" },
  { id: "banhchung-pray", name: "Banh Chung", src: "/Characters/banhchung/05_calm_pray.webp" },
  { id: "banhchung-surprised", name: "Banh Chung", src: "/Characters/banhchung/06_surprised.webp" },
  { id: "banhchung-cheer", name: "Banh Chung", src: "/Characters/banhchung/07_cheer.webp" },
  { id: "banhchung-sad", name: "Banh Chung", src: "/Characters/banhchung/08_sad.webp" },
  { id: "banhchung-angry", name: "Banh Chung", src: "/Characters/banhchung/09_angry.webp" },
  { id: "banhchung-cool", name: "Banh Chung", src: "/Characters/banhchung/10_cool_sunglasses.webp" },
  { id: "banhchung-love", name: "Banh Chung", src: "/Characters/banhchung/11_love_heart.webp" },
  { id: "banhchung-run", name: "Banh Chung", src: "/Characters/banhchung/12_run.webp" },
  { id: "banhchung-sleepy", name: "Banh Chung", src: "/Characters/banhchung/13_sleepy.webp" },
  { id: "banhchung-search", name: "Banh Chung", src: "/Characters/banhchung/14_search_magnifier.webp" },
  { id: "banhchung-confused", name: "Banh Chung", src: "/Characters/banhchung/15_confused_question.webp" },
];

export const DEFAULT_CHARACTER_ASSET = CHARACTER_ASSETS[0];

export function pickRandomCharacterAsset(currentId?: string): CharacterAsset {
  const candidates = CHARACTER_ASSETS.filter((asset) => asset.id !== currentId);
  const pool = candidates.length ? candidates : CHARACTER_ASSETS;
  return pool[Math.floor(Math.random() * pool.length)] ?? DEFAULT_CHARACTER_ASSET;
}
