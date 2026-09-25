import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const LANGUAGE_STORAGE_KEY = '04-xeplop-language';
const LEGACY_STORAGE_KEYS = ['game-straw-stack-language', 'xeplop-language'];

type SupportedLanguage = 'vi' | 'en';
export function isSupportedLanguage(value: string | null): value is SupportedLanguage {
  return value === 'vi' || value === 'en';
}

export function hasStoredLanguagePreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const value = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSupportedLanguage(value)) return true;
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      const legacyValue = window.localStorage.getItem(legacyKey);
      if (isSupportedLanguage(legacyValue)) return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function getInitialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'en';
  try {
    const value = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSupportedLanguage(value)) return value;
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      const legacyValue = window.localStorage.getItem(legacyKey);
      if (isSupportedLanguage(legacyValue)) {
        try {
          window.localStorage.setItem(LANGUAGE_STORAGE_KEY, legacyValue);
        } catch {}
        return legacyValue;
      }
    }
  } catch {
    // Storage read failure fallback
  }
  return 'en';
}

let isApplyingHostLocale = false;

export function persistLanguage(language: string): void {
  const normalized = language.split('-')[0];
  if (typeof window === 'undefined' || !isSupportedLanguage(normalized)) return;

  if (typeof document !== 'undefined') {
    document.documentElement.lang = normalized;
  }

  if (isApplyingHostLocale) return;

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
  } catch {
    // Optional persistence
  }
}

export const formatNumber = (value: number, lang?: string): string => {
  const current = lang || i18n.resolvedLanguage || i18n.language || 'en';
  return value.toLocaleString(current.startsWith('vi') ? 'vi-VN' : 'en-US');
};

export function applyHostLocale(value?: string): SupportedLanguage {
  const baseLocale = value?.trim().toLowerCase().split(/[-_]/, 1)[0];
  const normalized: SupportedLanguage = baseLocale === 'vi' ? 'vi' : 'en';
  try {
    isApplyingHostLocale = true;
    void i18n.changeLanguage(normalized);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = normalized;
    }
  } finally {
    isApplyingHostLocale = false;
  }
  return normalized;
}

export const selectLanguage = (locale: 'vi' | 'en'): void => {
  applyHostLocale(locale);
  persistLanguage(locale);
  if (typeof window !== 'undefined' && typeof (window as any).Wink?.setLocale === 'function') {
    try {
      (window as any).Wink.setLocale(locale);
    } catch {}
  }
};

const resources = {
  vi: {
    translation: {
      "PLAY": "CHƠI",
      "SETTINGS": "CÀI ĐẶT",
      "LEADERBOARD": "BẢNG XẾP HẠNG",
      "GAME OVER": "THUA RỒI",
      "REVIVE": "HỒI SINH",
      "SCORE": "ĐIỂM",
      "BEST": "KỶ LỤC",
      "FLOORS": "TẦNG",
      "RETRY": "CHƠI LẠI",
      "X2 SCORE": "x2 Điểm",
      "NO THANKS": "BỎ QUA",
      "RESUME": "Tiếp tục chơi",
      "MENU": "TRANG CHỦ",
      "MUSIC": "Nhạc nền",
      "SFX": "Âm thanh",
      "REDUCED MOTION": "Rung màn hình",
      "CLOSE": "ĐÓNG",
      "HINTS": "Gợi ý",
      "CONTINUE_WITH_VIDEO": "Xem video để hồi sinh?",
      "TAP_TO_START": "Chạm để bắt đầu",
      "PAUSE": "TẠM DỪNG",
      "ON": "Bật",
      "OFF": "Tắt",
      "LEADERBOARD_EMPTY": "Chưa có điểm nào được lưu.",
      "YOU": "Bạn",
      "NEW": "Mới",
      "NONE": "Chưa có",
      "BACK": "Quay lại",
      "LOADING_READY": "Hoàn tất!",
      "LOADING_PREPARING": "Đang chuẩn bị cánh đồng...",
      "PERFECT": "Đạt chuẩn!",
      "GOOD": "Rất gần!",
      "COMBO_X": "Chuỗi x{{count}}",
      "ONE_FLOOR": "Thêm 1 tầng",
      "STAGE_LOADING": "Đang tải sân chơi...",
      "ERROR_OCCURRED": "Đã xảy ra sự cố",
      "ERROR_DESC": "Trò chơi gặp lỗi bất ngờ trong quá trình hoạt động. Hãy thử tải lại trang.",
      "RELOAD_GAME": "Tải lại trò chơi",
      "LANGUAGE": "Ngôn ngữ",
      "PLAYER": "Người chơi"
    }
  },
  en: {
    translation: {
      "PLAY": "PLAY",
      "SETTINGS": "SETTINGS",
      "LEADERBOARD": "LEADERBOARD",
      "GAME OVER": "GAME OVER",
      "REVIVE": "REVIVE",
      "SCORE": "SCORE",
      "BEST": "BEST",
      "FLOORS": "FLOORS",
      "RETRY": "RETRY",
      "X2 SCORE": "x2 Score",
      "NO THANKS": "NO THANKS",
      "RESUME": "Continue Playing",
      "MENU": "MENU",
      "MUSIC": "Music",
      "SFX": "SFX",
      "REDUCED MOTION": "Reduced Motion",
      "CLOSE": "CLOSE",
      "HINTS": "Hints",
      "CONTINUE_WITH_VIDEO": "Watch video to revive?",
      "TAP_TO_START": "Tap to start",
      "PAUSE": "PAUSED",
      "ON": "ON",
      "OFF": "OFF",
      "LEADERBOARD_EMPTY": "No scores saved yet.",
      "YOU": "You",
      "NEW": "New",
      "NONE": "None",
      "BACK": "Back",
      "LOADING_READY": "Ready!",
      "LOADING_PREPARING": "Preparing field...",
      "PERFECT": "Perfect!",
      "GOOD": "Close!",
      "COMBO_X": "Combo x{{count}}",
      "ONE_FLOOR": "+1 Floor",
      "STAGE_LOADING": "Loading stage...",
      "ERROR_OCCURRED": "An error occurred",
      "ERROR_DESC": "The game encountered an unexpected error. Please try reloading the page.",
      "RELOAD_GAME": "Reload Game",
      "LANGUAGE": "Language",
      "PLAYER": "Player"
    }
  }
};

const initialLanguage = getInitialLanguage();
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLanguage;
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    supportedLngs: ['en', 'vi'],
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });
i18n.on('languageChanged', persistLanguage);

export default i18n;
