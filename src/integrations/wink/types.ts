export type WinkStatus = 'connecting' | 'connected' | 'online' | 'standalone';

export type WinkCapability =
  | 'getLeaderboard'
  | 'submitScore'
  | 'complete'
  | 'track';

export type WinkEvent =
  | 'pause'
  | 'resume'
  | 'mute'
  | 'unmute'
  | 'locale';

export type WinkIntegrationErrorCode =
  | 'PARENT_REQUIRED'
  | 'BRIDGE_READY_TIMEOUT'
  | 'PROTOCOL_MISMATCH'
  | 'RUNTIME_CONFIG_INVALID'
  | 'SESSION_CREATE_FAILED'
  | 'SESSION_RENEWAL_FAILED'
  | 'SESSION_EXPIRED'
  | 'CAPABILITY_DENIED'
  | 'API_NETWORK_ERROR'
  | 'MESSAGE_REJECTED'
  | 'BRIDGE_MISSING'
  | 'INVALID_SCORE'
  | 'INVALID_ROUND';

export interface WinkIntegrationError {
  code: WinkIntegrationErrorCode;
  message: string;
  retryable: boolean;
}

export interface WinkLeaderboardEntry {
  rank: number;
  score: number;
  playTime: number | null;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt?: string | null;
}

export interface WinkLeaderboard {
  entries: readonly WinkLeaderboardEntry[];
  me: WinkLeaderboardEntry | null;
  total?: number;
}

export interface WinkPlayer {
  isGuest: boolean;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface WinkScoreInput {
  score: number;
  playTime?: number;
  gameMode?: string;
  counter?: number;
  metadata?: Record<string, unknown>;
}

export interface WinkSDK {
  init(): Promise<WinkSDK>;
  gameplayStart(): void;
  gameplayStop(): void;
  submitScore(input: number | WinkScoreInput): Promise<{
    entry: WinkLeaderboardEntry | null;
    isNewBest: boolean;
    previousBest: number | null;
  }>;
  getLeaderboard(options?: {
    limit?: number;
    offset?: number;
  }): Promise<WinkLeaderboard>;
  getPersonalBest(options?: unknown): Promise<{ me: WinkLeaderboardEntry | null }>;
  track(eventName: string, properties?: Record<string, unknown>): Promise<void>;
  on(event: WinkEvent, listener: (data?: any) => void): () => void;
  can(capability: WinkCapability): boolean;
  readonly player: WinkPlayer | null;
  readonly locale: string;
  readonly muted: boolean;
  readonly status: WinkStatus;
  readonly version: string;
  readonly protocolVersion: number;
  destroy(): void;
}

declare global {
  interface Window {
    Wink?: WinkSDK;
  }
}

export interface WinkIntegration {
  status: WinkStatus;
  isReady: boolean;
  readyPromise: Promise<WinkSDK | null>;
  sdk: WinkSDK | null;
  hostPaused: boolean;
  parentMuted: boolean;
  locale: string;
  error: WinkIntegrationError | null;
  leaderboard: readonly WinkLeaderboardEntry[];
  personalBest: WinkLeaderboardEntry | null;
  can(capability: WinkCapability): boolean;
  gameplayStart(): void;
  gameplayStop(): void;
  refreshLeaderboard(): Promise<void>;
  refreshPersonalBest(): Promise<void>;
  submitFinalScore(input: {
    roundId?: string;
    score: number;
    playTimeSec?: number;
    qualifies?: boolean;
  }): Promise<void>;
  completeRound(input?: {
    roundId?: string;
    playDurationMs?: number;
  }): Promise<void>;
  track(eventName: string, properties?: Record<string, unknown>): void;
}
