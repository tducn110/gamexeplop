import { describe, expect, it } from "vitest";
import { advanceActiveCountdown } from "../activeCountdown";

describe("active countdowns", () => {
  it("does not consume crash time while host paused", () => {
    const paused = advanceActiveCountdown(
      { remainingMs: 620, lastTickAt: 100 },
      5100,
      true,
    );

    expect(paused.remainingMs).toBe(620);

    const resumed = advanceActiveCountdown(paused, 5200, false);
    expect(resumed.remainingMs).toBe(520);
  });

  it("consumes active time when not paused", () => {
    expect(advanceActiveCountdown(
      { remainingMs: 320, lastTickAt: 1000 },
      1320,
      false,
    ).remainingMs).toBe(0);
  });
});
