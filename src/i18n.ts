import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const LANGUAGE_STORAGE_KEY = 'xeplop-language';
type SupportedLanguage = 'vi' | 'en';
const isSupportedLanguage = (value: string | null): value is SupportedLanguage => value === 'vi' || value === 'en';
const getInitialLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') return 'vi';
  try { const value = window.localStorage.getItem(LANGUAGE_STORAGE_KEY); return isSupportedLanguage(value) ? value : 'vi'; } catch { return 'vi'; }
};
const persistLanguage = (language: string): void => {
  const normalized = language.split('-')[0];
  if (typeof window === 'undefined' || !isSupportedLanguage(normalized)) return;
  try { window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized); } catch { /* Optional persistence. */ }
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
      "X2 SCORE": "QUẢNG CÁO X2",
      "NO THANKS": "BỎ QUA",
      "RESUME": "TIẾP TỤC",
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
      "LANGUAGE": "Ngôn ngữ"
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
      "X2 SCORE": "X2 SCORE",
      "NO THANKS": "NO THANKS",
      "RESUME": "RESUME",
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
      "LANGUAGE": "Language"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    supportedLngs: ['vi', 'en'],
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false
    }
  });
i18n.on('languageChanged', persistLanguage);

export default i18n;
