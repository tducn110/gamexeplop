import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { useGameSession } from '../useGameSession';
import { resetGlobalWinkInit } from '../../../integrations/wink/useWinkIntegration';
import type { WinkSDK } from '../../../integrations/wink/types';

describe('useGameSession Wink lifecycle and score flow', () => {
  let originalWink: unknown;

  beforeEach(() => {
    resetGlobalWinkInit();
    originalWink = (globalThis as any).Wink;
  });

  afterEach(() => {
    resetGlobalWinkInit();
    (globalThis as any).Wink = originalWink;
  });

  it('calls gameplayStart on resume/start, calls gameplayStop exactly once, and submits X2 without duplicate stop', async () => {
    const gameplayStartSpy = vi.fn();
    const gameplayStopSpy = vi.fn();
    const submitScoreSpy = vi.fn(async () => ({
      entry: null,
      isNewBest: true,
      previousBest: null,
    }));
    const getLeaderboardSpy = vi.fn(async () => ({ entries: [], me: null, total: 0 }));

    const mockSdk: Partial<WinkSDK> = {
      init: vi.fn(async () => mockSdk as WinkSDK),
      gameplayStart: gameplayStartSpy,
      gameplayStop: gameplayStopSpy,
      submitScore: submitScoreSpy,
      getLeaderboard: getLeaderboardSpy,
      getPersonalBest: vi.fn(async () => ({ me: null })),
      can: vi.fn((cap) => cap === 'submitScore' || cap === 'getLeaderboard'),
      on: vi.fn(() => () => {}),
      status: 'online',
    };

    (globalThis as any).window = globalThis;
    (globalThis as any).Wink = mockSdk;

    let sessionInstance: ReturnType<typeof useGameSession> | null = null;
    function SessionConsumer() {
      sessionInstance = useGameSession();
      return null;
    }

    renderToString(React.createElement(SessionConsumer));
    expect(sessionInstance).not.toBeNull();

    // 1. Player starts playing (IDLE -> RUNNING)
    sessionInstance!.resumeGame();
    expect(gameplayStartSpy).toHaveBeenCalledTimes(1);

    // 2. Score changes during gameplay
    sessionInstance!.commitHud({ score: 50, floors: 5, combo: 2 });

    // 3. Skip revive -> finishes game
    sessionInstance!.skipRevive();
    expect(gameplayStopSpy).toHaveBeenCalledTimes(1);
    expect(submitScoreSpy).toHaveBeenCalledWith(expect.objectContaining({ score: 50 }));

    // 4. Player clicks X2 Score
    sessionInstance!.applyX2Score();
    // Allow queued in-flight submission to settle and trigger queued submission
    await new Promise((resolve) => setTimeout(resolve, 10));
    // gameplayStop must STILL only be called 1 time!
    expect(gameplayStopSpy).toHaveBeenCalledTimes(1);
    // Double score must be submitted
    expect(submitScoreSpy).toHaveBeenCalledWith(expect.objectContaining({ score: 100 }));
  });
});
