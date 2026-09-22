import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { DashboardScreen } from '../DashboardScreen';
import i18n from '@/i18n';

describe('Leaderboard & DashboardScreen', () => {
  it('renders LEADERBOARD title instead of BEST', () => {
    const html = renderToString(
      <DashboardScreen
        open={true}
        best={1250}
        bestFloors={12}
        personalBestRank={3}
        lastScore={1250}
        leaderboard={[
          { rank: 1, playerName: 'Top1', score: 2000, floors: 20 },
          { rank: 2, playerName: 'Top2', score: 1500, floors: 15 },
          { rank: 3, playerName: 'Player', score: 1250, floors: 12 },
        ]}
        playerName="Player"
        onClose={() => {}}
      />
    );

    expect(html).toContain(i18n.t('LEADERBOARD'));
    expect(html).toContain('leaderboardTitle');
  });

  it('renders top 10 only and shows YOU row with floors and score (0 floors and 0 score when no record)', () => {
    const entries = Array.from({ length: 15 }, (_, i) => ({
      rank: i + 1,
      playerName: `Player_${i + 1}`,
      score: 1000 - i * 50,
      floors: 10 - Math.floor(i / 2),
    }));

    const html = renderToString(
      <DashboardScreen
        open={true}
        best={0}
        bestFloors={0}
        personalBestRank={null}
        lastScore={0}
        leaderboard={entries}
        playerName=""
        onClose={() => {}}
      />
    );

    // Player 1 to 10 must be rendered
    expect(html).toContain('Player_1');
    expect(html).toContain('Player_10');
    // Player 11 onwards must NOT be rendered (top 10 limit)
    expect(html).not.toContain('Player_11');
    expect(html).not.toContain('Player_15');

    // The YOU row should display 0 floors and 0 score
    expect(html).toContain('leaderboardPlayerRow');
    expect(html).toContain('dashboardRankTime');
    expect(html).toContain(i18n.t('FLOORS').toLowerCase());
    expect(html).toContain('dashboardRankScore');
  });
});
