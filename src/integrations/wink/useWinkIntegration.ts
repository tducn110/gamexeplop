import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  WinkCapability,
  WinkIntegration,
  WinkIntegrationError,
  WinkIntegrationErrorCode,
  WinkLeaderboardEntry,
  WinkSDK,
  WinkScoreInput,
  WinkStatus,
  WinkSubmitScoreResult,
} from "./types";
import { applyHostLocale, selectLanguage } from "../../i18n";

const LEADERBOARD_REFRESH_COOLDOWN_MS = 2_000;

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

export function buildScoreMetadata(
  roundId: string | undefined,
  metadata: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  const scoreMetadata: Record<string, unknown> = {};
  if (roundId) {
    scoreMetadata.roundId = roundId;
  }
  if (metadata) {
    for (const [key, value] of Object.entries(metadata)) {
      if (value !== undefined) {
        scoreMetadata[key] = value;
      }
    }
  }
  return Object.keys(scoreMetadata).length > 0 ? scoreMetadata : undefined;
}

export function mapSubmitScoreError(error: unknown): WinkIntegrationError {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error && typeof (error as any).message === "string"
        ? (error as any).message
        : "";

  if (message.includes("Score input is invalid")) {
    return safeError("INVALID_SCORE");
  }

  return safeError("API_NETWORK_ERROR", true);
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

function useWinkIntegrationInstance(): WinkIntegration {
  const [sdk, setSdk] = useState<WinkSDK | null>(
    typeof window !== "undefined" ? window.Wink || null : null,
  );
  const [status, setStatus] = useState<WinkStatus>(sdk?.status ?? "connecting");
  const [isReady, setIsReady] = useState(false);
  const [hostPaused, setHostPaused] = useState(false);
  const [parentMuted, setParentMuted] = useState(sdk?.muted ?? false);
  const [locale, setLocale] = useState(normalizeLocale(sdk?.locale));
  const [error, setError] = useState<WinkIntegrationError | null>(null);
  const [personalBest, setPersonalBest] = useState<WinkLeaderboardEntry | null>(null);
  const [leaderboard, setLeaderboard] = useState<readonly WinkLeaderboardEntry[]>([]);

  const sdkRef = useRef<WinkSDK | null>(sdk);
  sdkRef.current = sdk;

  const leaderboardInFlightRef = useRef<Promise<void> | null>(null);
  const personalBestInFlightRef = useRef<Promise<void> | null>(null);
  const lastLeaderboardFetchAtMsRef = useRef<number>(0);
  const lastPersonalBestFetchAtMsRef = useRef<number>(0);
  const refreshLeaderboardRef = useRef<(options?: { force?: boolean }) => Promise<void>>(() => Promise.resolve());
  const refreshPersonalBestRef = useRef<(options?: { force?: boolean }) => Promise<void>>(() => Promise.resolve());

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

        try {
          const lbCleanup = resolvedSdk.on("leaderboard", () => {
            void refreshLeaderboardRef.current({ force: true });
          });
          if (typeof lbCleanup === "function") cleanups.push(lbCleanup);
        } catch {
          // Optional host event
        }
        try {
          const scoreCleanup = resolvedSdk.on("score", () => {
            void refreshPersonalBestRef.current({ force: true });
          });
          if (typeof scoreCleanup === "function") cleanups.push(scoreCleanup);
        } catch {
          // Optional host event
        }

        // Fetch personal best immediately on boot so UI displays high score
        void resolvedSdk
          .getPersonalBest()
          .then((result) => {
            if (!unmounted && result?.me) setPersonalBest(result.me);
          })
          .catch(() => undefined);
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

  const refreshLeaderboard = useCallback(async (options?: { force?: boolean }) => {
    const currentSdk = sdkRef.current;
    if (!currentSdk) {
      return;
    }

    if (!currentSdk.can("getLeaderboard")) {
      return;
    }

    if (leaderboardInFlightRef.current) {
      return leaderboardInFlightRef.current;
    }

    const now = Date.now();
    if (!options?.force && now - lastLeaderboardFetchAtMsRef.current < LEADERBOARD_REFRESH_COOLDOWN_MS) {
      return;
    }

    const fetchPromise = (async () => {
      try {
        const board = await currentSdk.getLeaderboard({ limit: 10 });
        if (!board || !Array.isArray(board.entries)) {
          throw new TypeError("Wink leaderboard response is invalid");
        }
        setLeaderboard(board.entries);
        if (board.me) setPersonalBest(board.me);
        lastLeaderboardFetchAtMsRef.current = Date.now();
        setError(null);
      } catch (err: unknown) {
        console.warn("[WinkIntegration] getLeaderboard error", err);
        // A transient SDK/network error must not turn previously loaded remote data into an empty board.
        setError(safeError("API_NETWORK_ERROR", true));
      } finally {
        leaderboardInFlightRef.current = null;
      }
    })();

    leaderboardInFlightRef.current = fetchPromise;
    return fetchPromise;
  }, []);

  const refreshPersonalBest = useCallback(async (options?: { force?: boolean }) => {
    const currentSdk = sdkRef.current;
    if (!currentSdk) {
      return;
    }

    if (personalBestInFlightRef.current) {
      return personalBestInFlightRef.current;
    }

    const now = Date.now();
    if (!options?.force && now - lastPersonalBestFetchAtMsRef.current < LEADERBOARD_REFRESH_COOLDOWN_MS) {
      return;
    }

    const fetchPromise = (async () => {
      try {
        const result = await currentSdk.getPersonalBest();
        if (result?.me) setPersonalBest(result.me);
        lastPersonalBestFetchAtMsRef.current = Date.now();
      } catch {
        // Ignored non-fatal in standalone or network glitch
      } finally {
        personalBestInFlightRef.current = null;
      }
    })();

    personalBestInFlightRef.current = fetchPromise;
    return fetchPromise;
  }, []);

  refreshLeaderboardRef.current = refreshLeaderboard;
  refreshPersonalBestRef.current = refreshPersonalBest;

  const submitFinalScore = useCallback(
    async (input: {
      roundId?: string;
      score: number;
      playTimeSec?: number;
      qualifies?: boolean;
      metadata?: Record<string, unknown>;
    }): Promise<WinkSubmitScoreResult | null> => {
      if (input.qualifies === false) return null;
      const score = Math.trunc(input.score);
      if (!Number.isFinite(score) || score < 0) {
        setError(safeError("INVALID_SCORE"));
        return null;
      }

      const currentSdk = sdkRef.current;
      if (!currentSdk) return null;

      if (!currentSdk.can("submitScore")) {
        const denied = safeError("CAPABILITY_DENIED");
        setError(denied);
        return null;
      }

      try {
        const scoreInput: WinkScoreInput = {
          score,
          playTime: Math.max(0, Math.trunc(input.playTimeSec ?? 0)),
        };
        const metadata = buildScoreMetadata(input.roundId, input.metadata);
        if (metadata) {
          scoreInput.metadata = metadata;
        }

        const response = await currentSdk.submitScore(scoreInput);
        if (response?.entry) {
          setPersonalBest(response.entry);
        }
        setError(null);
        return {
          entry: response?.entry ?? null,
          isNewBest: Boolean(response?.isNewBest),
          previousBest: response?.previousBest ?? null,
        };
      } catch (err: unknown) {
        console.warn("[WinkIntegration] submitScore error", err);
        setError(mapSubmitScoreError(err));
        return null;
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

  const mode = status === "standalone" ? ("offline" as const) : ("wink" as const);
  const phase = !isReady
    ? ("booting" as const)
    : sdkRef.current?.player?.isGuest === false
      ? ("ready_authenticated" as const)
      : ("ready_anonymous" as const);

  const displayName = sdkRef.current?.player?.displayName ?? sdk?.player?.displayName ?? null;
  const bestScore = personalBest?.score ?? 0;
  const canSubmitScore = sdkRef.current?.can("submitScore") ?? false;
  const canGetLeaderboard = sdkRef.current?.can("getLeaderboard") ?? false;

  return {
    status,
    isReady,
    readyPromise: resolveGlobalWink(),
    sdk,
    mode,
    phase,
    hostPaused,
    parentMuted,
    hostMuted: parentMuted,
    locale,
    displayName,
    bestScore,
    error,
    leaderboard,
    personalBest,
    playerEntry: personalBest,
    can,
    canSubmitScore,
    canGetLeaderboard,
    setLocale: selectLanguage,
    gameplayStart,
    gameplayStop,
    refreshLeaderboard,
    refreshPersonalBest,
    submitFinalScore,
    completeRound,
  };
}

const WinkContext = createContext<WinkIntegration | null>(null);

export function WinkProvider({ children }: { children: ReactNode }) {
  const integration = useWinkIntegrationInstance();
  return createElement(WinkContext.Provider, { value: integration }, children);
}

export function useWinkIntegration(): WinkIntegration {
  const context = useContext(WinkContext);
  if (context) return context;
  return useWinkIntegrationInstance();
}
