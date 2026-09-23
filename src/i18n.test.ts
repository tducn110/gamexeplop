import { describe, expect, it, beforeEach } from "vitest";

// Mock localStorage and document for node environment
const storage = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, val: string) => storage.set(key, String(val)),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
};

(globalThis as any).window = {
  localStorage: mockLocalStorage,
};
(globalThis as any).document = {
  documentElement: { lang: "en" },
};

import i18n, {
  LANGUAGE_STORAGE_KEY,
  getInitialLanguage,
  hasStoredLanguagePreference,
  applyHostLocale,
  formatNumber,
} from "./i18n";

describe("i18n configuration and persistence (Standard 01 contract)", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    (globalThis as any).document.documentElement.lang = "en";
  });

  it("defaults to English ('en') on fresh storage (first fallback is English)", () => {
    expect(getInitialLanguage()).toBe("en");
    expect(hasStoredLanguagePreference()).toBe(false);
  });

  it("falls back to 'en' when storage contains invalid language", () => {
    mockLocalStorage.setItem(LANGUAGE_STORAGE_KEY, "invalid-locale");
    expect(getInitialLanguage()).toBe("en");
    expect(hasStoredLanguagePreference()).toBe(false);
  });

  it("hasStoredLanguagePreference returns true only after valid preference is saved", async () => {
    expect(hasStoredLanguagePreference()).toBe(false);
    await i18n.changeLanguage("vi");
    expect(hasStoredLanguagePreference()).toBe(true);
    expect(mockLocalStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("vi");
  });

  it("applyHostLocale is authoritative per Wink SDK 10.1.0 contract", async () => {
    // Host sends 'vi' -> sets language to 'vi'
    const result = applyHostLocale("vi");
    expect(result).toBe("vi");
    expect(i18n.resolvedLanguage).toBe("vi");

    // Host sends 'en' -> sets language to 'en'
    const enResult = applyHostLocale("en");
    expect(enResult).toBe("en");
    expect(i18n.resolvedLanguage).toBe("en");
  });

  it("has CLOSE key in both locales", () => {
    expect(i18n.t("CLOSE", { lng: "en" })).toBe("CLOSE");
    expect(i18n.t("CLOSE", { lng: "vi" })).toBe("ĐÓNG");
  });

  it("formats numbers according to active language locale", async () => {
    await i18n.changeLanguage("en");
    expect(formatNumber(1024)).toBe("1,024");

    await i18n.changeLanguage("vi");
    expect(formatNumber(1024)).toBe("1.024");
  });
});
