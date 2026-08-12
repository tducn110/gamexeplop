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
  { id: "banhchung-cheer", name: "Banh Chung", src: "/Characters/banhchung/07_cheer.png" },
  { id: "banhchung-run", name: "Banh Chung", src: "/Characters/banhchung/12_run.png" },
  { id: "chorach-01", name: "Cho Rach", src: "/Characters/chorach/transparent_png/dog_01.png" },
  { id: "chorach-02", name: "Cho Rach", src: "/Characters/chorach/transparent_png/dog_02.png" },
  { id: "chorach-03", name: "Cho Rach", src: "/Characters/chorach/transparent_png/dog_03.png" },
  { id: "chorach-04", name: "Cho Rach", src: "/Characters/chorach/transparent_png/dog_04.png" },
  { id: "chorach-05", name: "Cho Rach", src: "/Characters/chorach/transparent_png/dog_05.png" },
  { id: "chorach-06", name: "Cho Rach", src: "/Characters/chorach/transparent_png/dog_06.png" },
  { id: "chorach-07", name: "Cho Rach", src: "/Characters/chorach/transparent_png/dog_07.png" },
  { id: "chorach-08", name: "Cho Rach", src: "/Characters/chorach/transparent_png/dog_08.png" },
  { id: "cuuvi-01", name: "Cuu Vi", src: "/Characters/CuuVI/orange_cat_sprite_cuts/cat_01_transparent_center_530x530.png" },
  { id: "cuuvi-02", name: "Cuu Vi", src: "/Characters/CuuVI/orange_cat_sprite_cuts/cat_02_transparent_center_530x530.png" },
  { id: "cuuvi-03", name: "Cuu Vi", src: "/Characters/CuuVI/orange_cat_sprite_cuts/cat_03_transparent_center_530x530.png" },
  { id: "cuuvi-04", name: "Cuu Vi", src: "/Characters/CuuVI/orange_cat_sprite_cuts/cat_04_transparent_center_530x530.png" },
  { id: "cuuvi-05", name: "Cuu Vi", src: "/Characters/CuuVI/orange_cat_sprite_cuts/cat_05_transparent_center_530x530.png" },
  { id: "cuuvi-06", name: "Cuu Vi", src: "/Characters/CuuVI/orange_cat_sprite_cuts/cat_06_transparent_center_530x530.png" },
  { id: "cuuvi-07", name: "Cuu Vi", src: "/Characters/CuuVI/orange_cat_sprite_cuts/cat_07_transparent_center_530x530.png" },
  { id: "cuuvi-08", name: "Cuu Vi", src: "/Characters/CuuVI/orange_cat_sprite_cuts/cat_08_transparent_center_530x530.png" },
  { id: "cauvangmanh-01", name: "Cau Vang Manh", src: "/Characters/cauvangmanh/buff_doge_sprites_center_pivot/doge_01_idle_flex.png" },
  { id: "cauvangmanh-02", name: "Cau Vang Manh", src: "/Characters/cauvangmanh/buff_doge_sprites_center_pivot/doge_02_wave.png" },
  { id: "cauvangmanh-03", name: "Cau Vang Manh", src: "/Characters/cauvangmanh/buff_doge_sprites_center_pivot/doge_03_double_flex.png" },
  { id: "cauvangmanh-04", name: "Cau Vang Manh", src: "/Characters/cauvangmanh/buff_doge_sprites_center_pivot/doge_04_arms_crossed_happy.png" },
  { id: "cauvangmanh-07", name: "Cau Vang Manh", src: "/Characters/cauvangmanh/buff_doge_sprites_center_pivot/doge_07_cool_sunglasses.png" },
  { id: "cauvangmanh-11", name: "Cau Vang Manh", src: "/Characters/cauvangmanh/buff_doge_sprites_center_pivot/doge_11_detective_walk.png" },
  { id: "laclac-front", name: "Lac Lac", src: "/Characters/laclac/512/laclac_01_front_tpose_512.png" },
  { id: "laclac-left", name: "Lac Lac", src: "/Characters/laclac/512/laclac_05_three_quarter_left_512.png" },
  { id: "laclac-right", name: "Lac Lac", src: "/Characters/laclac/512/laclac_06_three_quarter_right_512.png" },
];

export const DEFAULT_CHARACTER_ASSET = CHARACTER_ASSETS[0];

export function pickRandomCharacterAsset(currentId?: string): CharacterAsset {
  const candidates = CHARACTER_ASSETS.filter((asset) => asset.id !== currentId);
  const pool = candidates.length ? candidates : CHARACTER_ASSETS;
  return pool[Math.floor(Math.random() * pool.length)] ?? DEFAULT_CHARACTER_ASSET;
}
