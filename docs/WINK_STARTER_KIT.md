# Wink SDK v1 integration

This game uses the canonical Wink SDK contract. The game owns gameplay and UI;
the SDK owns the iframe session, capabilities, leaderboard, and host lifecycle.

## Required entrypoint

`index.html` must load the SDK before the deferred application module:

```html
<script src="https://sdk.winkgames.fun/v1/wink.js"></script>
<script type="module" src="/src/main.tsx"></script>
```

The integration module is
`src/integrations/wink/useWinkIntegration.ts`. It calls `window.Wink.init()`
once, subscribes to pause/resume, mute/unmute, and locale, and exposes the
remote leaderboard and personal best to the Dashboard. Direct standalone
launch remains playable without faking a Wink session.

## Gameplay contract

- Call `gameplayStart()` when the player first controls a round.
- Call `gameplayStop()` once at the semantic end of the round.
- Check `can("submitScore")` before submitting the final non-negative integer
  score.
- Check `can("getLeaderboard")` before reading the remote leaderboard.
- Keep score submission independent from round completion.
- Treat locale values as `vi` or `en`; unknown values fall back to `en`.
- Do not add custom tracking, direct Wink HTTP calls, tokens, game IDs, API
  URLs, custom `postMessage`, or a copied bridge/runtime config.

## Repository contract

`wink.game.json` declares schema v1, runtime `wink-sdk`, protocol 1, SDK major
1, profile `vite-static-v1`, and static output `dist`. The repository uses one
root lockfile and the standard commands are:

```bash
npm run typecheck
npm test
npm run build
```

The build must produce `dist/index.html`. Developers merge source into
`develop`; deployment and production promotion remain platform-owner work.
