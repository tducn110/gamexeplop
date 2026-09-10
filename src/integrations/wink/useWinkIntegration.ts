import { useCallback, useEffect, useRef, useState } from "react";
import i18n from "../../i18n";
import type {
  WinkCapability,
  WinkIntegration,
  WinkIntegrationError,
  WinkIntegrationErrorCode,
  WinkLeaderboardEntry,
  WinkSDK,
  WinkStatus,
} from "./types";

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

// Global bootstrap promise so multiple hook instances share the same initialization
let globalInitPromise: Promise<WinkSDK | null> | null = null;
let lastTargetWink: unknown = undefined;

export function resetGlobalWinkInit(): void {
  globalInitPromise = null;
  lastTargetWink = undefined;
}

export function resolveGlobalWink(): Promise<WinkSDK | null> {
  const currentWink = typeof window !== "undefined" ? window.Wink : undefined;
  if (globalInitPromise && lastTargetWink === currentWink) {
    return globalInitPromise;
  }
  lastTargetWink = currentWink;

  globalInitPromise = new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }

    const checkSdk = () => {
      if (window.Wink?.init) {
        window.Wink.init()
          .then((sdk) => resolve(sdk))
          .catch(() => resolve(window.Wink || null));
        return true;
      }
      return false;
    };

    if (checkSdk()) return;

    // In test environment, don't wait 2.5s if not in browser
    const maxWaitMs = typeof process !== "undefined" && process.env.NODE_ENV === "test" ? 100 : 2000;
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 25;
      if (checkSdk() || elapsed >= maxWaitMs) {
        clearInterval(interval);
        resolve(window.Wink || null);
      }
    }, 25);
  });

  return globalInitPromise;
}

export function useWinkIntegration(): WinkIntegration {
  const [sdk, setSdk] = useState<WinkSDK | null>(typeof window !== "undefined" ? window.Wink || null : null);
  const [status, setStatus] = useState<WinkStatus>(sdk?.status ?? "connecting");
  const [isReady, setIsReady] = useState(false);
  const [hostPaused, setHostPaused] = useState(false);
  const [parentMuted, setParentMuted] = useState(sdk?.muted ?? false);
  const [locale, setLocale] = useState(sdk?.locale ?? "vi");
  const [error, setError] = useState<WinkIntegrationError | null>(null);
  const [personalBest, setPersonalBest] = useState<WinkLeaderboardEntry | null>(null);
  const [leaderboard, setLeaderboard] = useState<readonly WinkLeaderboardEntry[]>([]);

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
        if (resolvedSdk.locale) {
          setLocale(resolvedSdk.locale);
          const lang = resolvedSdk.locale === "vi" ? "vi" : "en";
          void i18n.changeLanguage(lang);
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
              setLocale(nextLocale);
              const lang = nextLocale === "vi" ? "vi" : "en";
              void i18n.changeLanguage(lang);
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

  const can = useCallback(
    (capability: WinkCapability): boolean => {
      return sdkRef.current?.can(capability) ?? false;
    },
    [],
  );

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
    if (!currentSdk || !currentSdk.can("submitScore")) {
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

  const track = useCallback(
    (eventName: string, properties?: Record<string, unknown>) => {
      const currentSdk = sdkRef.current;
      if (currentSdk && currentSdk.can("track")) {
        currentSdk.track(eventName, properties).catch((err) => {
          console.warn("[WinkIntegration] track error", err);
        });
      }
    },
    [],
  );

  return {
    status,
    isReady,
    readyPromise: resolveGlobalWink(),
    sdk,
    hostPaused,
    parentMuted,
    locale,
    error,
    leaderboard,
    personalBest,
    can,
    gameplayStart,
    gameplayStop,
    refreshLeaderboard,
    refreshPersonalBest,
    submitFinalScore,
    completeRound,
    track,
  };
}
