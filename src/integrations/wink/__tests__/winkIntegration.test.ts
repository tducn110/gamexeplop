import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  resolveGlobalWink,
  resetGlobalWinkInit,
  useWinkIntegration,
  buildScoreMetadata,
  mapSubmitScoreError,
} from '../useWinkIntegration';
import type { WinkSDK } from '../types';

describe('Wink SDK v1 Integration (04_xeplop node test)', () => {
  let originalWink: unknown;

  beforeEach(() => {
    resetGlobalWinkInit();
    originalWink = (globalThis as any).Wink;
  });

  afterEach(() => {
    resetGlobalWinkInit();
    (globalThis as any).Wink = originalWink;
  });

  it('resolves safely when window.Wink is absent (standalone mode)', async () => {
    delete (globalThis as any).Wink;
    const sdk = await resolveGlobalWink();
    expect(sdk).toBeNull();
  });

  it('resolves and initializes window.Wink SDK v1 when present', async () => {
    const mockSdk: Partial<WinkSDK> = {
      init: vi.fn(async () => mockSdk as WinkSDK),
      gameplayStart: vi.fn(),
      gameplayStop: vi.fn(),
      can: vi.fn((cap) => cap === 'submitScore'),
      status: 'online',
    };

    (globalThis as any).window = globalThis;
    (globalThis as any).Wink = mockSdk;

    const sdk = await resolveGlobalWink();
    expect(mockSdk.init).toHaveBeenCalled();
    expect(sdk).toBe(mockSdk);
    expect(sdk?.can('submitScore')).toBe(true);
  });

  it('submitFinalScore never sends metadata: undefined and properly formats payload', async () => {
    let capturedPayload: any = null;
    const mockSdk: Partial<WinkSDK> = {
      init: vi.fn(async () => mockSdk as WinkSDK),
      gameplayStart: vi.fn(),
      gameplayStop: vi.fn(),
      can: vi.fn(() => true),
      submitScore: vi.fn(async (payload) => {
        capturedPayload = payload;
        return {
          entry: { rank: 1, score: payload.score, playTime: payload.playTime, displayName: 'Test', avatarUrl: null },
          isNewBest: true,
          previousBest: 0,
        };
      }),
      getPersonalBest: vi.fn(async () => ({ me: null })),
      getLeaderboard: vi.fn(async () => ({ entries: [], me: null, total: 0 })),
      on: vi.fn(() => () => {}),
      status: 'online',
    };

    (globalThis as any).window = globalThis;
    (globalThis as any).Wink = mockSdk;

    let integration: ReturnType<typeof useWinkIntegration> | null = null;
    function TestConsumer() {
      integration = useWinkIntegration();
      return null;
    }

    renderToString(React.createElement(TestConsumer));
    expect(integration).not.toBeNull();

    // Submit score without roundId
    const result = await integration!.submitFinalScore({
      score: 150.8,
      playTimeSec: 12.3,
    });

    expect(capturedPayload).not.toBeNull();
    // Must NOT have 'metadata' property when roundId is absent
    expect(Object.hasOwn(capturedPayload, 'metadata')).toBe(false);
    expect(capturedPayload.score).toBe(150); // truncated integer
    expect(capturedPayload.playTime).toBe(12); // truncated integer
    expect(result?.isNewBest).toBe(true);
    expect(result?.entry?.score).toBe(150);

    // Submit score WITH roundId
    await integration!.submitFinalScore({
      roundId: 'round-123',
      score: 200,
    });
    expect(Object.hasOwn(capturedPayload, 'metadata')).toBe(true);
    expect(capturedPayload.metadata).toEqual({ roundId: 'round-123' });

    // Submit score with metadata containing undefined fields (should strip undefined)
    await integration!.submitFinalScore({
      roundId: 'round-456',
      score: 250,
      metadata: {
        floors: 10,
        emptyProp: undefined,
      },
    });
    expect(capturedPayload.metadata).toEqual({ roundId: 'round-456', floors: 10 });
    expect(Object.hasOwn(capturedPayload.metadata, 'emptyProp')).toBe(false);
  });

  it('buildScoreMetadata handles edge cases and avoids metadata: undefined crash', () => {
    // 1. When roundId and metadata are absent, returns undefined (no metadata field attached)
    expect(buildScoreMetadata(undefined, undefined)).toBeUndefined();
    expect(buildScoreMetadata('', undefined)).toBeUndefined();

    // 2. When only roundId is present
    expect(buildScoreMetadata('round-1', undefined)).toEqual({ roundId: 'round-1' });

    // 3. When metadata has undefined properties, strips them
    expect(
      buildScoreMetadata('round-2', {
        floors: 5,
        badField: undefined,
        nullField: null,
      }),
    ).toEqual({
      roundId: 'round-2',
      floors: 5,
      nullField: null,
    });

    // 4. When metadata contains only undefined fields, returns undefined
    expect(buildScoreMetadata(undefined, { empty: undefined })).toBeUndefined();
  });

  it('mapSubmitScoreError classifies "Score input is invalid" as INVALID_SCORE', () => {
    const invalidErr = new Error('WinkBridgeError: Score input is invalid');
    expect(mapSubmitScoreError(invalidErr)).toEqual({
      code: 'INVALID_SCORE',
      message: 'Điểm số cuối không hợp lệ.',
      retryable: false,
    });

    const networkErr = new Error('Failed to fetch');
    expect(mapSubmitScoreError(networkErr)).toEqual({
      code: 'API_NETWORK_ERROR',
      message: 'Không thể kết nối dịch vụ Wink.',
      retryable: true,
    });

    const objErr = { message: 'Score input is invalid in bridge' };
    expect(mapSubmitScoreError(objErr)).toEqual({
      code: 'INVALID_SCORE',
      message: 'Điểm số cuối không hợp lệ.',
      retryable: false,
    });
  });

  it('submitFinalScore rejects negative and non-finite scores', async () => {
    const mockSdk: Partial<WinkSDK> = {
      init: vi.fn(async () => mockSdk as WinkSDK),
      can: vi.fn(() => true),
      submitScore: vi.fn(),
      getPersonalBest: vi.fn(async () => ({ me: null })),
      on: vi.fn(() => () => {}),
      status: 'online',
    };

    (globalThis as any).window = globalThis;
    (globalThis as any).Wink = mockSdk;

    let integration: ReturnType<typeof useWinkIntegration> | null = null;
    function TestConsumer() {
      integration = useWinkIntegration();
      return null;
    }

    renderToString(React.createElement(TestConsumer));

    const resultNegative = await integration!.submitFinalScore({ score: -10 });
    expect(resultNegative).toBeNull();
    expect(mockSdk.submitScore).not.toHaveBeenCalled();

    const resultNaN = await integration!.submitFinalScore({ score: NaN });
    expect(resultNaN).toBeNull();
    expect(mockSdk.submitScore).not.toHaveBeenCalled();
  });

  it('refreshLeaderboard deduplicates in-flight calls and respects cooldown and force', async () => {
    let leaderboardCallCount = 0;
    const mockSdk: Partial<WinkSDK> = {
      init: vi.fn(async () => mockSdk as WinkSDK),
      can: vi.fn((cap) => cap === 'getLeaderboard'),
      getLeaderboard: vi.fn(async () => {
        leaderboardCallCount++;
        return {
          entries: [{ rank: 1, score: 500, playTime: 20, displayName: 'Top', avatarUrl: null }],
          me: null,
          total: 1,
        };
      }),
      getPersonalBest: vi.fn(async () => ({ me: null })),
      on: vi.fn(() => () => {}),
      status: 'online',
    };

    (globalThis as any).window = globalThis;
    (globalThis as any).Wink = mockSdk;

    let integration: ReturnType<typeof useWinkIntegration> | null = null;
    function TestConsumer() {
      integration = useWinkIntegration();
      return null;
    }

    renderToString(React.createElement(TestConsumer));

    // First call
    await integration!.refreshLeaderboard();
    expect(leaderboardCallCount).toBe(1);

    // Rapid second call within 2000ms without force should be throttled
    await integration!.refreshLeaderboard();
    expect(leaderboardCallCount).toBe(1);

    // Concurrent calls should be deduplicated
    await Promise.all([
      integration!.refreshLeaderboard({ force: true }),
      integration!.refreshLeaderboard({ force: true }),
    ]);
    expect(leaderboardCallCount).toBe(2);

    // Call with force: true bypasses throttling
    await integration!.refreshLeaderboard({ force: true });
    expect(leaderboardCallCount).toBe(3);
  });
});
