import { PERFECT_TOLERANCE, SCORE_BASE, SCORE_GOOD, SCORE_PERFECT } from "../core/constants";

export interface ScoreOutcome {
  kind: "perfect" | "good" | "base";
  combo: number;
  scoreDelta: number;
}

export function calculateScore(totalCut: number, combo: number): ScoreOutcome {
  const isPerfect = totalCut <= PERFECT_TOLERANCE;
  if (isPerfect) {
    const nextCombo = combo + 1;
    return {
      kind: "perfect",
      combo: nextCombo,
      scoreDelta: SCORE_PERFECT + SCORE_BASE * Math.min(nextCombo, 6),
    };
  }

  if (totalCut < 36) {
    return {
      kind: "good",
      combo: 0,
      scoreDelta: SCORE_GOOD + SCORE_BASE,
    };
  }

  return {
    kind: "base",
    combo: 0,
    scoreDelta: SCORE_BASE,
  };
}
