import { readStorage, writeStorage } from "@/lib/storage";

const PLAYER_KEY = "straw_stack_player";

export function loadPlayerName() {
  return readStorage<string>(PLAYER_KEY, "");
}

export function savePlayerName(name: string) {
  writeStorage(PLAYER_KEY, name.trim());
}
