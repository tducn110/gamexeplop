import { useCallback, useEffect, useRef, useState } from "react";
import type {
  WinkCapability,
  WinkIntegration,
  WinkIntegrationError,
  WinkIntegrationErrorCode,
  WinkLeaderboardEntry,
  WinkSDK,
  WinkStatus,
} from "./types";
import { applyHostLocale, selectLanguage } from "../../i18n";

const SAFE_ERROR_MESSAGES: Record<WinkIntegrationErrorCode, string> = {
  PARENT_REQUIRED: "Mini-game phải được mở trong iframe Wink.",
  BRIDGE_READY_TIMEOUT: "Không thể khởi tạo kết nối với Wink.",
  PROTOCOL_MISMATCH: "Phiên bản giao thức Wink không tương thích.",
  RUNTIME_CONFIG_INVALID: "Cấu hình mini-game không hợp lệ.",
  SESSION_CREATE_FAILED: "Không thể tạo phiên chơi.",
  SESSION_RENEWAL_FAILED: "Không thể gia hạn phiên chơi.",
  SESSION_EXPIRED: "Phiên chơi đã hết hạn.",
  CAPABILITY_DENIED: "Thao tác này không được cấp quyền cho phiên hiện tại.",
  API_NETWORK_ERROR: "Không thể kết nối dịch vụ Wink.",
  MESSAGE_REJECTED: "Thông điệp từ Wink không hợp lệ.",
  BRIDGE_MISSING: "Wink SDK chưa sẵn sàng.",
  INVALID_SCORE: "Điểm số cuối không hợp lệ.",
  INVALID_ROUND: "Mã vòng chơi không hợp lệ.",
};

function safeError(
  code: WinkIntegrationErrorCode,
  retryable = false,
): WinkIntegrationError {
  return Object.freeze({
    code,
    message: SAFE_ERROR_MESSAGES[code] || "Lỗi kết nối Wink.",
    retryable,
  });
}

function normalizeLocale(value?: string): "vi" | "en" {
  const locale = value?.split("-")[0];
  return locale === "vi" || locale === "en" ? locale : "en";
}

// Global bootstrap promise so multiple hook instances share the same initialization
let globalInitPromise: Promise<WinkSDK | null> | null = null;
let lastTargetWink: unknown = undefined;
let isResolving = false;
let activeTimerCleanup: (() => void) | null = null;

export function resetGlobalWinkInit(): void {
  if (activeTimerCleanup) {
    activeTimerCleanup();
    activeTimerCleanup = null;
  }
  globalInitPromise = null;
  lastTargetWink = undefined;
  isResolving = false;
}

export function resolveGlobalWink(): Promise<WinkSDK | null> {
  const currentWink = typeof window === "undefined" ? undefined : window.Wink;
  if (globalInitPromise) {
    if (isResolving || lastTargetWink === currentWink) {
      return globalInitPromise;
    }
  }

  isResolving = true;
  lastTargetWink = currentWink;
  globalInitPromise = new Promise<WinkSDK | null>((resolve) => {
    if (typeof window === "undefined") {
      isResolving = false;
      resolve(null);
      return;
    }

    let isSettled = false;
    const finish = (result: WinkSDK | null) => {
      if (isSettled) return;
      isSettled = true;
      isResolving = false;
      lastTargetWink = typeof window !== "undefined" ? window.Wink : undefined;
      if (activeTimerCleanup) {
        activeTimerCleanup();
        activeTimerCleanup = null;
      }
      resolve(result);
    };

    const startInit = (sdk: WinkSDK): boolean => {
      if (!sdk || typeof sdk.init !== "function") return false;
      try {
        void sdk
          .init()
          .then((session) => finish(session ?? sdk))
          .catch(() => finish(null));
        return true;
      } catch {
        finish(null);
        return true;
      }
    };

    const initialSdk = window.Wink;
    if (initialSdk && startInit(initialSdk)) {
      return;
    }

    const timerFn = typeof setInterval === "function" ? setInterval : undefined;
    const clearFn =
      typeof clearInterval === "function" ? clearInterval : undefined;

    if (!timerFn || !clearFn) {
      finish(null);
      return;
    }

    const maxWaitMs =
      typeof process !== "undefined" && process.env.NODE_ENV === "test"
        ? 100
        : 2000;
    let elapsed = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const stopInterval = () => {
      if (intervalId !== null) {
        clearFn(intervalId);
        intervalId = null;
      }
    };

    activeTimerCleanup = stopInterval;

    intervalId = timerFn(() => {
      elapsed += 25;
      const candidate = typeof window !== "undefined" ? window.Wink : undefined;
      if (candidate && startInit(candidate)) {
        stopInterval();
        activeTimerCleanup = null;
        return;
      }

      if (elapsed >= maxWaitMs) {
        stopInterval();
        activeTimerCleanup = null;
        finish(null);
      }
    }, 25);
  });

  return globalInitPromise;
}

export function useWinkIntegration(): WinkIntegration {
  const [sdk, setSdk] = useState<WinkSDK | null>(
    typeof window !== "undefined" ? window.Wink || null : null,
  );
  const [status, setStatus] = useState<WinkStatus>(sdk?.status ?? "connecting");
  const [isReady, setIsReady] = useState(false);
  const [hostPaused, setHostPaused] = useState(false);
  const [parentMuted, setParentMuted] = useState(sdk?.muted ?? false);
  const [locale, setLocale] = useState(normalizeLocale(sdk?.locale));
  const [error, setError] = useState<WinkIntegrationError | null>(null);
  const [personalBest, setPersonalBest] = useState<WinkLeaderboardEntry | null>(
    null,
  );
  const [leaderboard, setLeaderboard] = useState<
    readonly WinkLeaderboardEntry[]
  >([]);

  const sdkRef = useRef<WinkSDK | null>(sdk);
  sdkRef.current = sdk;

  useEffect(() => {
    let unmounted = false;
    const cleanups: Array<() => void> = [];

    void resolveGlobalWink().then((resolvedSdk) => {
      if (unmounted) return;
      if (resolvedSdk) {
        setSdk(resolvedSdk);
        setStatus(resolvedSdk.status);
        setParentMuted(resolvedSdk.muted);
        const initialLocale = normalizeLocale(resolvedSdk.locale);
        setLocale(initialLocale);
        if (resolvedSdk.locale) {
          applyHostLocale(resolvedSdk.locale);
        }

        try {
          cleanups.push(
            resolvedSdk.on("pause", () => {
              setHostPaused(true);
            }),
          );
          cleanups.push(
            resolvedSdk.on("resume", () => {
              setHostPaused(false);
            }),
          );
          cleanups.push(
            resolvedSdk.on("mute", () => {
              setParentMuted(true);
            }),
          );
          cleanups.push(
            resolvedSdk.on("unmute", () => {
              setParentMuted(false);
            }),
          );
          cleanups.push(
            resolvedSdk.on("locale", (nextLocale: string) => {
              const normalizedLocale = normalizeLocale(nextLocale);
              setLocale(normalizedLocale);
              applyHostLocale(nextLocale);
            }),
          );
        } catch (e) {
          console.warn("[WinkIntegration] Error subscribing to SDK events", e);
        }
      } else {
        setStatus("standalone");
      }
      setIsReady(true);
    });

    return () => {
      unmounted = true;
      cleanups.forEach((cleanup) => {
        try {
          cleanup();
        } catch {}
      });
    };
  }, []);

  const can = useCallback((capability: WinkCapability): boolean => {
    return sdkRef.current?.can(capability) ?? false;
  }, []);

  const gameplayStart = useCallback(() => {
    try {
      sdkRef.current?.gameplayStart();
    } catch (e) {
      console.warn("[WinkIntegration] gameplayStart error", e);
    }
  }, []);

  const gameplayStop = useCallback(() => {
    try {
      sdkRef.current?.gameplayStop();
    } catch (e) {
      console.warn("[WinkIntegration] gameplayStop error", e);
    }
  }, []);

  const refreshLeaderboard = useCallback(async () => {
    const currentSdk = sdkRef.current;
    if (!currentSdk) {
      setLeaderboard([]);
      setPersonalBest(null);
      return;
    }

    if (!currentSdk.can("getLeaderboard")) {
      setLeaderboard([]);
      setPersonalBest(null);
      return;
    }

    try {
      const board = await currentSdk.getLeaderboard({ limit: 30 });
      setLeaderboard(board.entries || []);
      if (board.me) setPersonalBest(board.me);
      setError(null);
    } catch (err: any) {
      console.warn("[WinkIntegration] getLeaderboard error", err);
      setError(safeError("API_NETWORK_ERROR", true));
      setLeaderboard([]);
    }
  }, []);

  const refreshPersonalBest = useCallback(async () => {
    const currentSdk = sdkRef.current;
    if (!currentSdk) {
      setPersonalBest(null);
      return;
    }

    try {
      const result = await currentSdk.getPersonalBest();
      if (result?.me) setPersonalBest(result.me);
    } catch {
      // Ignored non-fatal in standalone or network glitch
    }
  }, []);

  const submitFinalScore = useCallback(
    async (input: {
      roundId?: string;
      score: number;
      playTimeSec?: number;
      qualifies?: boolean;
    }) => {
      const currentSdk = sdkRef.current;
      if (input.qualifies === false) return;
      if (!currentSdk) return;

      if (!currentSdk.can("submitScore")) {
        const denied = safeError("CAPABILITY_DENIED");
        setError(denied);
        return;
      }

      try {
        await currentSdk.submitScore({
          score: input.score,
          playTime: input.playTimeSec ?? 0,
          metadata: input.roundId ? { roundId: input.roundId } : undefined,
        });
        setError(null);
      } catch (err: any) {
        console.warn("[WinkIntegration] submitScore error", err);
        setError(safeError("API_NETWORK_ERROR", true));
      }
    },
    [],
  );

  const completeRound = useCallback(
    async (_input?: { roundId?: string; playDurationMs?: number }) => {
      gameplayStop();
    },
    [gameplayStop],
  );

  const displayName = sdk?.player?.displayName ?? null;
  const bestScore = personalBest?.score ?? 0;

  return {
    status,
    isReady,
    readyPromise: resolveGlobalWink(),
    sdk,
    hostPaused,
    parentMuted,
    locale,
    displayName,
    bestScore,
    error,
    leaderboard,
    personalBest,
    can,
    setLocale: selectLanguage,
    gameplayStart,
    gameplayStop,
    refreshLeaderboard,
    refreshPersonalBest,
    submitFinalScore,
    completeRound,
  };
}
