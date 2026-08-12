# Wink starter kit

Everything in this directory is copied **into a game repository**. It is
self-contained: nothing here needs a Wink checkout at build time.

The normal way to install it is the scaffolder, run once from the Wink
repository:

```bash
node game-template/init-game.mjs \
  --repo /path/to/my-game \
  --id <GAME_UUID> \
  --slug <game-slug> \
  --title "Game title"
```

That copies these files, substitutes the game identity, generates
`public/wink-runtime-config.json`, writes `public/wink-bridge.lock.json`, and
merges the npm scripts from `package.scripts.json`.

## What lands in the game repository

| Path | Purpose |
| --- | --- |
| `public/wink-bridge.js` | Certified bridge artifact, byte-for-byte |
| `public/wink-bridge.lock.json` | Version/protocol/bytes/checksum lock |
| `public/wink-runtime-config.json` | Generated public config (5 fields) |
| `scripts/wink-contract.mjs` | Single source of truth for every pin |
| `scripts/generate-wink-runtime-config.mjs` | Strict public config generator |
| `scripts/sync-wink-bridge.mjs` | (Re)writes the bridge lock |
| `scripts/verify-wink-bridge.mjs` | Fail-closed bridge + config + entry check |
| `scripts/verify-game-config.mjs` | Cross-checks `game.config.sh` against the contract |
| `scripts/verify-docker-headers.mjs` | Runs real Nginx and asserts headers |
| `src/integrations/wink/wink-bridge.ts` | TypeScript facade for the SDK |
| `src/integrations/wink/client.ts` | The game's only Wink adapter |
| `src/integrations/wink/__tests__/client.test.ts` | Adapter contract tests |
| `etc/default.conf.template` | Nginx with exact `frame-ancestors` |
| `Dockerfile` | Multi-stage build from source → Nginx |
| `.dockerignore` | Keeps source, secrets, and evidence out of the image |
| `game.config.sh` | The only per-game deployment inputs |
| `deploy.sh` | Gated check / build-push / deploy / rollback |
| `wink-integration.json` | Handoff manifest for `verify-handoff.mjs` |
| `artifacts/minigame-pilot/` | Local, git-ignored deploy metadata |

## After scaffolding

1. Load the bridge before game code in the HTML entry:

   ```html
   <script src="/wink-bridge.js"></script>
   <script type="module" src="/src/main.tsx"></script>
   ```

   `verify-wink-bridge.mjs` only requires that no other `src=` or
   `type="module"` script precedes it, so any bundler layout works.

2. Wire the game into `src/integrations/wink/client.ts` at the five semantic
   boundaries, then replace every `"TODO"` in `wink-integration.json` with a
   real description. The verifier rejects `"TODO"` (under 16 characters), so
   `WINK_HANDOFF_OK` is unreachable until the semantics are documented.

3. Run the gates:

   ```bash
   npm run verify:wink-bridge
   npm test
   npm run typecheck
   npm run build
   ```

4. Follow `game-template/docs/GAME_DEV_HANDOFF.md` for harness testing and the
   13-row behavioural matrix.

## Editing rules

- `public/wink-bridge.js` is certified — never hand-edit or re-minify it.
- `public/wink-runtime-config.json` is generated — never hand-edit it.
- `game.config.sh` has one editable block at the top; everything below it is
  derived and re-validated by `verify-game-config.mjs`.
- `scripts/wink-contract.mjs` is identical in every game. Changing it here
  desynchronises this game from the platform.
