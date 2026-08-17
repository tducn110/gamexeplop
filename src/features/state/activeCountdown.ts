export interface ActiveCountdownState {
  remainingMs: number;
  lastTickAt: number;
}

/** Consume elapsed time only while the host allows the game to run. */
export function advanceActiveCountdown(
  state: ActiveCountdownState,
  now: number,
  paused: boolean,
): ActiveCountdownState {
  return {
    remainingMs: paused ? state.remainingMs : state.remainingMs - (now - state.lastTickAt),
    lastTickAt: now,
  };
}
