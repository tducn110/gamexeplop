# Root Refactor Plan

## 1. Executive Summary

This project currently ships as a single React component that mixes gameplay rules, Canvas 2D rendering, input handling, RAF loops, score state, and overlays. The refactor target is a game-first architecture with:

- Pure TypeScript game core for deterministic rules.
- PixiJS v8 for realtime rendering, textures, ticker, input, and effects.
- React for app shell, HUD overlays, dashboard, settings, login modal, and committed state only.
- Service boundaries for local score persistence and future leaderboard/auth integration.

The root path has a real trailing space and must be treated as authoritative:

```txt
/home/pro/Downloads/intern/5_Gamexeplop 
```

The originally requested reference path `1_fruitslashing` does not exist. The real path is:

```txt
/home/pro/Downloads/intern/1_FruitSlashing
```

Current verified scripts:

```bash
npm run build
npm run dev
```

Missing scripts to add later when tooling exists:

```bash
npm run typecheck
npm test
npm run lint
```

## 2. Current Codebase Audit

- Runtime path: `index.html -> src/main.tsx -> src/app/App.tsx -> src/app/components/StrawStackGame.tsx`
- Current production behavior is implemented almost entirely in `StrawStackGame.tsx`.
- `npm run build` currently passes on the baseline repo.
- The project is not a git repository and requires a timestamped safety backup before source refactoring.
- The repo still contains large amounts of Figma/shadcn scaffold UI under `src/app/components/ui/*` that are not part of the runtime path.

## 3. LearningMaterials Findings

Use `/home/pro/Downloads/intern/LearningMaterials` as the workflow and architecture source of truth.

Key findings reused in this refactor:

- Generated Figma output must be treated as prototype code, not production architecture.
- React/PixiJS boundaries must be explicit: React owns screens and committed state, Pixi owns continuous rendering and input.
- Pure game logic must be isolated from rendering and backend code.
- Game overlays must live outside the renderer layer.
- Refactor work must be staged, verified after each major block, and rolled back locally if a block breaks the build.
- The UI must stay game-first and must not drift into a landing-page layout.

## 4. Reference Project Findings

### 4.1 Lessons From 1_fruitslashing

Copy or adapt:

- Pure core separation through `src/game/core.ts`
- `useGameSession` for countdown, result commit, and one-shot game finish
- `useGameTicker` for Pixi ticker orchestration and controlled React HUD sync
- `usePixiApp` for Pixi lifecycle, layer refs, resize handling, and cleanup
- Sprite map synchronization instead of rebuilding render objects every frame
- Generated texture cleanup on resize and unmount
- Particle/effect pooling and direct render-layer mutation
- Backend boundary where score submission happens after game over
- Local storage fallback pattern behind a service wrapper
- React overlay outside the Pixi surface

Avoid copying directly:

- Fruit-specific mechanics and naming
- Slash-specific input model
- Fruit-specific physics
- Firebase coupling before the stack game needs it

### 4.2 Lessons From 2_2048

Copy or adapt:

- Warm design-token system and visual direction
- Reusable button variants
- Panel and modal shell styling
- Dashboard leaderboard rows
- Settings toggles
- Local stats hook for v1 persistence
- Keeping the game mounted while panels open
- GSAP tween cleanup from the Pixi renderer

Avoid copying directly:

- 2048-specific tile logic
- 2048 board sizing assumptions
- 2048 scoring model
- Monolithic renderer patterns when feature-split modules are clearer

## 5. Current File-by-File Diagnosis

### package.json

Current role:
- Defines Vite build/dev scripts and all runtime dependencies.

Problems:
- No `pixi.js`.
- No `gsap`.
- No test or typecheck tooling.
- Large amount of scaffold-only dependency weight from unused UI packages.

Refactor decision:
- Modify.

Target destination:
- Remains at repo root.

Reason:
- Needs new scripts and dependencies for the refactor.

Dependencies:
- `vite`, `react`, `react-dom`, current scaffold packages.

Tests needed:
- `npm run build` after dependency and script changes.

### index.html

Current role:
- Vite entry HTML.

Problems:
- Title and metadata still reflect prototype wording.

Refactor decision:
- Modify.

Target destination:
- Remains at repo root.

Reason:
- Needs accurate product metadata after architecture cleanup.

Dependencies:
- `src/main.tsx`

Tests needed:
- `npm run build`

### vite.config.ts

Current role:
- Vite configuration with Figma-oriented setup.

Problems:
- May contain prototype-specific assumptions that are no longer needed after cleanup.

Refactor decision:
- Keep first, then modify conservatively if needed.

Target destination:
- Remains at repo root.

Reason:
- Do not destabilize the build until the runtime migration is complete.

Dependencies:
- Vite, React plugin, Tailwind plugin.

Tests needed:
- `npm run build`

### src/main.tsx

Current role:
- React mount entry.

Problems:
- No issue structurally, but it currently bootstraps a prototype app shell.

Refactor decision:
- Modify lightly.

Target destination:
- `src/main.tsx`

Reason:
- May need provider setup and stable global style imports.

Dependencies:
- `src/app/App.tsx`, `src/styles/index.css`

Tests needed:
- `npm run build`

### src/app/App.tsx

Current role:
- Minimal wrapper that renders `StrawStackGame`.

Problems:
- No shell separation, no route/screen model, no panel ownership boundary.

Refactor decision:
- Replace.

Target destination:
- `src/app/App.tsx` backed by `src/app/layout` and `src/app/routes`

Reason:
- React should own shell, screens, and overlay panel state.

Dependencies:
- `StrawStackGame.tsx` today.

Tests needed:
- `npm run build`

### src/app/components/StrawStackGame.tsx

Current role:
- Single-file game implementation.

Problems:
- Mixes constants, types, pure game state, update loop, Canvas drawing, input handlers, score state, best-score state, and overlays.
- Uses Canvas 2D and `requestAnimationFrame`.
- Keeps gameplay/render concerns inside a React component.

Refactor decision:
- Split and replace. Move original file to `_unused` once Pixi runtime is verified.

Target destination:
- Core logic to `src/features/game/core/*` and `src/features/game/logic/*`
- Session/store to `src/features/game/state/*`
- Input to `src/features/game/input/*`
- Pixi runtime to `src/features/game/render/*`
- HUD/overlays to `src/components/game-ui/*`

Reason:
- This file is the architectural bottleneck.

Dependencies:
- React only today.

Tests needed:
- Build, future core tests, future render lifecycle tests.

### src/app/components/figma/ImageWithFallback.tsx

Current role:
- Figma export helper.

Problems:
- Not in runtime path.

Refactor decision:
- Move to `_unused`.

Target destination:
- `_unused/figma/ImageWithFallback.tsx`

Reason:
- Keep it available for recovery without shipping it.

Dependencies:
- Figma-generated UI only.

Tests needed:
- `npm run build` after isolation.

### src/app/components/ui/*

Current role:
- Large scaffold-only shadcn/Radix UI library.

Problems:
- Not used by the runtime path.
- Inflates mental overhead and may hide dead dependencies.

Refactor decision:
- Move to `_unused/ui-scaffold` in a dedicated cleanup phase after verification.

Target destination:
- `_unused/ui-scaffold/*`

Reason:
- Preserve recoverability while removing production-path noise.

Dependencies:
- Radix, form, chart, sidebar, and other scaffold packages.

Tests needed:
- `npm run build` after each move block.

### src/imports/pasted_text/design-system-doc.md

Current role:
- Embedded pasted design-system document.

Problems:
- Wrong location and not enforced by runtime styling.

Refactor decision:
- Promote and adapt.

Target destination:
- Root `design.md` or keep original plus derive `src/styles/design-tokens.css`

Reason:
- The design system must become an active source of truth.

Dependencies:
- Global styles and UI primitives.

Tests needed:
- `npm run build`

### src/styles/index.css

Current role:
- Global style entry.

Problems:
- Imports scaffold theme files rather than a dedicated game token stack.

Refactor decision:
- Modify.

Target destination:
- `src/styles/index.css`

Reason:
- It should import `fonts.css`, `tailwind.css`, `design-tokens.css`, `globals.css`, `game.css`, and `ui.css`.

Dependencies:
- Global app shell.

Tests needed:
- `npm run build`

### src/styles/theme.css

Current role:
- Generic Figma/shadcn variable set.

Problems:
- Does not fully encode the intended game design system.

Refactor decision:
- Replace or slim down into dedicated token files.

Target destination:
- Mostly superseded by `src/styles/design-tokens.css`

Reason:
- Tokens should reflect the actual game direction from LearningMaterials and `2_2048`.

Dependencies:
- Any remaining Tailwind tokens.

Tests needed:
- `npm run build`

### src/styles/globals.css

Current role:
- Currently mostly empty.

Problems:
- No stable app-shell defaults for the refactor target.

Refactor decision:
- Modify.

Target destination:
- `src/styles/globals.css`

Reason:
- Needs root sizing, body background, font, and canvas-shell rules.

Dependencies:
- Global layout.

Tests needed:
- `npm run build`

### src/styles/fonts.css

Current role:
- Loads `Be Vietnam Pro`.

Problems:
- None.

Refactor decision:
- Keep.

Target destination:
- `src/styles/fonts.css`

Reason:
- Matches the intended design direction.

Dependencies:
- Global typography.

Tests needed:
- `npm run build`

### src/styles/tailwind.css

Current role:
- Tailwind v4 source file.

Problems:
- Still points at broad prototype source patterns.

Refactor decision:
- Keep and adjust only as needed.

Target destination:
- `src/styles/tailwind.css`

Reason:
- Useful for utility styling during the refactor without destabilizing the build.

Dependencies:
- Tailwind v4.

Tests needed:
- `npm run build`

## 6. Target Architecture

The target architecture is:

- `core`: deterministic game state and transitions
- `logic`: scoring, collision, spawning, progression helpers
- `state`: React-owned committed state and session flow
- `input`: normalized pointer/tap intent, no per-frame React ownership
- `render/pixi`: Application, stage, layers, textures, sprites, resize, ticker
- `render/animations`: GSAP feedback with explicit teardown
- `render/effects`: particles, shake, floating text state synced to Pixi/React layers
- `backend` and `db`: score and leaderboard service boundaries
- `components/game-ui`: HUD and modal/panel overlays
- `components/ui/primitives`: shared game UI primitives

## 7. Target Directory Tree

```txt
src/
  app/
    App.tsx
    routes/
      index.tsx
    providers/
    layout/
      GameShell.tsx

  components/
    ui/
      primitives/
        GameButton.tsx
        IconButton.tsx
        PanelFrame.tsx
        StatRow.tsx
        AlertBanner.tsx
    game-ui/
      GameHud.tsx
      GameOverOverlay.tsx
      CountdownOverlay.tsx
      FloatingTextLayer.tsx
      DashboardPanel.tsx
      SettingsPanel.tsx
      LoginModal.tsx

  features/
    game/
      core/
        core.ts
        types.ts
        constants.ts
        config.ts
      logic/
        rules.ts
        scoring.ts
        progression.ts
        collision.ts
        spawning.ts
      state/
        useGameSession.ts
        useGameStore.ts
      input/
        normalizePointer.ts
        useGameInput.ts
      render/
        pixi/
          usePixiApp.ts
          PixiGameStage.tsx
          containers.ts
          textures.ts
          sprites.ts
          resize.ts
        animations/
          gsapTimelines.ts
          feedbackAnimations.ts
        effects/
          particles.ts
          screenShake.ts
          floatingText.ts
      backend/
        scoreApi.ts
        leaderboardApi.ts
        authBridge.ts
      db/
        schema.ts
        scoreRecord.ts
      tests/
        core.test.ts
        scoring.test.ts
        renderLifecycle.test.ts

  lib/
    storage.ts
    cn.ts
    firebase.ts

  styles/
    globals.css
    design-tokens.css
    game.css
    ui.css
```

### src/features/game/core

Purpose:
- Pure game rules and deterministic state transitions.

Allowed dependencies:
- TypeScript only.

Forbidden:
- React, PixiJS, GSAP, DOM APIs, storage, backend, CSS.

Files:
- `core.ts`
- `types.ts`
- `constants.ts`
- `config.ts`

### src/features/game/logic

Purpose:
- Split non-render helpers by concern.

Allowed dependencies:
- `core` types and config.

Forbidden:
- React, PixiJS, DOM, backend.

Files:
- `rules.ts`
- `scoring.ts`
- `progression.ts`
- `collision.ts`
- `spawning.ts`

### src/features/game/state

Purpose:
- React hooks for committed state and session flow.

Allowed dependencies:
- React, `core`, `logic`, backend service wrappers.

Forbidden:
- Pixi render object ownership.

Files:
- `useGameSession.ts`
- `useGameStore.ts`

### src/features/game/input

Purpose:
- Normalize user intent into game actions.

Allowed dependencies:
- React hooks, Pixi canvas/event bridge, core action APIs.

Forbidden:
- Rendering logic, backend.

Files:
- `normalizePointer.ts`
- `useGameInput.ts`

### src/features/game/render/pixi

Purpose:
- Pixi app lifecycle and realtime stage ownership.

Allowed dependencies:
- PixiJS, core state refs, effect helpers.

Forbidden:
- Backend service calls, UI business logic.

Files:
- `usePixiApp.ts`
- `PixiGameStage.tsx`
- `containers.ts`
- `textures.ts`
- `sprites.ts`
- `resize.ts`

### src/features/game/render/animations

Purpose:
- GSAP-based feedback and non-core motion.

Allowed dependencies:
- GSAP, Pixi/React targets, effect state.

Forbidden:
- Gameplay rules, storage, backend.

Files:
- `gsapTimelines.ts`
- `feedbackAnimations.ts`

### src/features/game/render/effects

Purpose:
- Particle, shake, and floating-text lifecycle support.

Allowed dependencies:
- PixiJS and lightweight shared state.

Forbidden:
- React screen logic, backend, scoring rules.

Files:
- `particles.ts`
- `screenShake.ts`
- `floatingText.ts`

### src/components/game-ui

Purpose:
- React HUD and panel overlays above the Pixi canvas.

Allowed dependencies:
- React, primitives, committed state hooks.

Forbidden:
- Core rule mutation, Pixi lifecycle ownership.

Files:
- `GameHud.tsx`
- `GameOverOverlay.tsx`
- `CountdownOverlay.tsx`
- `FloatingTextLayer.tsx`
- `DashboardPanel.tsx`
- `SettingsPanel.tsx`
- `LoginModal.tsx`

## 8. HTML5 Rendering Replacement Plan

Current Canvas/HTML5 responsibilities inside `StrawStackGame.tsx`:

- Canvas setup and `getContext`
- Background drawing
- Bamboo/straw/block drawing
- Spark/flash/piece drawing
- RAF loop
- Resize handling
- Click and touch gameplay input
- HUD text drawn into the visual surface

Replacement mapping:

- Canvas setup -> `render/pixi/usePixiApp.ts`
- Background draw -> `render/pixi/containers.ts` and `textures.ts`
- Block visuals -> `render/pixi/sprites.ts`
- Visual effects -> `render/effects/*`
- RAF loop -> Pixi `app.ticker`
- Resize -> `render/pixi/resize.ts`
- Input -> `input/normalizePointer.ts` and `input/useGameInput.ts`
- HUD/score text -> `components/game-ui/GameHud.tsx`

The old Canvas runtime remains available only in `_unused` after the Pixi version works.

## 9. PixiJS Render Architecture

- Use PixiJS v8 `Application` with async `init`.
- Use explicit layer refs: background, world/play, effects, optional overlay text.
- Use `ResizeObserver` or controlled resize sync.
- Use generated textures or lightweight `Graphics` for straw bundles and environment.
- Keep sprite instances in maps keyed by stable entity ids.
- Use `ticker.deltaMS` for update steps.
- Destroy generated textures on resize/unmount.
- Destroy app with `releaseGlobalResources: true`.
- Avoid React rerenders during pointer movement or frame updates.

## 10. GSAP Animation Architecture

- Add GSAP only if needed for feedback and panel transitions.
- Keep GSAP in `src/features/game/render/animations/*`.
- Use it for countdown pulse, perfect-drop pulse, panel entrance/exit, and floating-score emphasis.
- Every timeline or tween must be killed on reset, replay, sprite removal, unmount, and Pixi destroy.
- Do not place GSAP timelines in arbitrary React UI components.

## 11. React UI Architecture

- `App.tsx` owns high-level screen state.
- `GameShell.tsx` owns layout and panel mounting.
- React stores only:
  - screen state
  - dashboard/settings/login visibility
  - committed score/best/floor values
  - idle/running/gameOver status
  - leaderboard data
  - user/session settings
- React does not store:
  - per-frame pointer coordinates
  - sprite positions
  - drop velocity
  - particle state
  - ticker state

## 12. Game Core / Logic Architecture

- `core.ts` should expose game creation, state advance, action application, and terminal-state detection.
- `logic/scoring.ts` should isolate score/combo/floor increments.
- `logic/collision.ts` should isolate overlap and alignment math.
- `logic/spawning.ts` should isolate next-block creation.
- `logic/progression.ts` should isolate speed/width difficulty progression.
- Core modules must remain browser-independent and unit-testable.

## 13. Backend / DB / Leaderboard Architecture

- V1 uses local persistence through `lib/storage.ts`.
- `backend/scoreApi.ts` saves score after game over only.
- `backend/leaderboardApi.ts` reads local leaderboard data and can later swap to remote.
- `backend/authBridge.ts` stays as a thin guest-first placeholder unless auth is later required.
- `db/schema.ts` and `db/scoreRecord.ts` define shapes only, not live DB code.
- Render and core files must not import storage or backend directly.

## 14. Design System Integration

- Promote the existing design document into enforced tokens.
- Derive `src/styles/design-tokens.css` from the warm paper/bamboo/orange palette already documented.
- Keep `Be Vietnam Pro` as the main font.
- Reuse `2_2048` patterns for:
  - buttons
  - panel frames
  - ranking rows
  - settings rows
  - dashboard shells
- Reject landing-page hero composition.

## 15. Component Reuse Plan

Copy or adapt from `2_2048`:

- `Button.tsx` -> `components/ui/primitives/GameButton.tsx`
- panel card styling -> `PanelFrame.tsx`
- score/stat rows -> `StatRow.tsx`
- dashboard ranking row patterns -> `DashboardPanel.tsx`
- settings toggle layout -> `SettingsPanel.tsx`
- login modal shell -> `LoginModal.tsx`

Copy or adapt from `1_FruitSlashing`:

- `usePixiApp` structure
- `useGameSession`
- `useGameTicker` pattern
- texture lifecycle handling
- sprite sync maps
- effect pooling

## 16. Files To Create

- `ROOT_REFACTOR_PLAN.md`
- `AGENTS.md`
- `design.md` or equivalent promoted design reference
- `src/app/routes/index.tsx`
- `src/app/layout/GameShell.tsx`
- `src/components/ui/primitives/*`
- `src/components/game-ui/*`
- `src/features/game/core/*`
- `src/features/game/logic/*`
- `src/features/game/state/*`
- `src/features/game/input/*`
- `src/features/game/render/*`
- `src/features/game/backend/*`
- `src/features/game/db/*`
- `src/features/game/tests/*`
- `src/lib/storage.ts`
- `src/lib/cn.ts`
- `src/styles/design-tokens.css`
- `src/styles/game.css`
- `src/styles/ui.css`

## 17. Files To Modify

- `package.json`
- `index.html`
- `vite.config.ts` if required
- `src/main.tsx`
- `src/app/App.tsx`
- `src/styles/index.css`
- `src/styles/globals.css`
- `src/styles/theme.css` or replacement token path
- README if final documentation cleanup is needed

## 18. Files To Delete Or Move To _unused

Move only, do not permanently delete in the first run:

- `src/app/components/StrawStackGame.tsx` after Pixi runtime is stable
- `src/app/components/figma/ImageWithFallback.tsx`
- `src/app/components/ui/*`
- any dead prototype helpers discovered during migration

Suggested destinations:

- `_unused/legacy-game/StrawStackGame.tsx`
- `_unused/figma/*`
- `_unused/ui-scaffold/*`

## 19. Migration Phases

## Phase 0 — Audit And Baseline

Goal:
- Lock the current state and create the root planning document.

Actions:
- Create/update `ROOT_REFACTOR_PLAN.md`
- Record runtime path, script set, root-path trailing-space issue, reference findings
- Run `npm run build`

Files touched:
- `ROOT_REFACTOR_PLAN.md`

Verification:
- `npm run build`

Rollback:
- Remove or restore the plan file only.

Done when:
- The planning document exists and the current build still passes.

## Phase 1 — Initialize AGENTS.md From LearningMaterials

Goal:
- Create project rules before source mutation.

Actions:
- Create/update `AGENTS.md`
- Encode architecture boundaries and workflow rules

Files touched:
- `AGENTS.md`

Verification:
- `npm run build`

Rollback:
- Restore `AGENTS.md` from backup or delete it.

Done when:
- AGENTS rules exist and are aligned with LearningMaterials.

## Phase 2 — Figma Triage And Unused UI Cleanup

Goal:
- Remove scaffold noise from the active runtime path without deleting it.

Actions:
- Move unused Figma/shadcn files into `_unused`
- Keep build green after each move block

Files touched:
- `src/app/components/ui/*`
- `src/app/components/figma/*`
- `_unused/*`

Verification:
- `npm run build`

Rollback:
- Move files back from `_unused`.

Done when:
- Only runtime-relevant UI remains in active source paths.

## Phase 3 — Design Token And UI Primitive Normalization

Goal:
- Build the visual system required by the refactor.

Actions:
- Create design tokens
- Create game UI primitives
- Wire global style imports

Files touched:
- `src/styles/*`
- `src/components/ui/primitives/*`

Verification:
- `npm run build`

Rollback:
- Restore style and primitive files from backup.

Done when:
- Shared game UI primitives and tokens exist.

## Phase 4 — Extract Pure Game Core

Goal:
- Move deterministic gameplay rules out of React and Canvas code.

Actions:
- Create core and logic modules
- Port state creation, update, scoring, and overlap logic
- Preserve gameplay behavior

Files touched:
- `src/features/game/core/*`
- `src/features/game/logic/*`

Verification:
- `npm run build`
- `npm test` if test tooling is added

Rollback:
- Restore core modules from backup or disable imports and fall back to legacy file.

Done when:
- The core can drive the game without React-owned frame state.

## Phase 5 — Extract Game State / Session Hooks

Goal:
- Create committed-state hooks without reintroducing per-frame React ownership.

Actions:
- Add `useGameSession`
- Add `useGameStore`
- Keep session/result flow in React, not render internals

Files touched:
- `src/features/game/state/*`

Verification:
- `npm run build`

Rollback:
- Restore previous app-shell state usage.

Done when:
- React owns only committed state and panel/session flow.

## Phase 6 — Introduce PixiJS App Shell

Goal:
- Mount a clean Pixi app lifecycle before porting gameplay visuals.

Actions:
- Add PixiJS dependency if missing
- Create `usePixiApp` and `PixiGameStage`
- Verify mount, resize, and teardown

Files touched:
- `package.json`
- `src/features/game/render/pixi/*`

Verification:
- `npm run build`

Rollback:
- Remove new Pixi shell imports and restore previous shell path.

Done when:
- A stable Pixi surface mounts and cleans up correctly.

## Phase 7 — Replace HTML5 Render With PixiJS Renderer

Goal:
- Port the live renderer off Canvas 2D.

Actions:
- Port background
- Port blocks
- Port sparks/flashes/debris
- Replace RAF with Pixi ticker
- Move HUD text out of the render surface

Files touched:
- `src/features/game/render/*`
- `src/components/game-ui/*`
- legacy `StrawStackGame.tsx` for extraction

Verification:
- `npm run build`

Rollback:
- Keep the legacy renderer in `_unused` for restoration.

Done when:
- Canvas 2D realtime rendering is gone from the active path.

## Phase 8 — Add GSAP Animation Layer

Goal:
- Add controlled feedback animation without polluting React components.

Actions:
- Add GSAP if missing
- Create animation modules
- Add cleanup for all tweens/timelines

Files touched:
- `package.json`
- `src/features/game/render/animations/*`

Verification:
- `npm run build`

Rollback:
- Remove GSAP imports and restore non-GSAP transitions.

Done when:
- Feedback motion exists with explicit teardown.

## Phase 9 — Reconnect UI Overlays, Dashboard, Settings, And Login

Goal:
- Restore a polished full game shell above the Pixi runtime.

Actions:
- Build HUD, game over, dashboard, settings, login
- Keep the game mounted while panels open where practical

Files touched:
- `src/components/game-ui/*`
- `src/app/*`

Verification:
- `npm run build`

Rollback:
- Revert shell imports to previous phase state.

Done when:
- The full shell exists and does not own realtime render state.

## Phase 10 — Backend/Database/Leaderboard Boundary Cleanup

Goal:
- Put local persistence and future backend hooks behind services.

Actions:
- Add score and leaderboard service wrappers
- Keep localStorage isolated behind `lib/storage.ts`

Files touched:
- `src/features/game/backend/*`
- `src/features/game/db/*`
- `src/lib/storage.ts`

Verification:
- `npm run build`

Rollback:
- Temporarily disable persistence imports and restore local-only display.

Done when:
- Core and render code do not import persistence directly.

## Phase 11 — Testing, Profiling, And Performance Verification

Goal:
- Add minimal verification around the new architecture.

Actions:
- Add scripts only if tooling is installed
- Add core and render lifecycle tests if safe
- Profile obvious render hot paths

Files touched:
- `package.json`
- `src/features/game/tests/*`

Verification:
- `npm run build`
- `npm run typecheck` if added
- `npm test` if added

Rollback:
- Remove unstable test tooling additions if they block a green build.

Done when:
- Available automated checks pass and the runtime architecture is stable.

## Phase 12 — Final Cleanup And Documentation

Goal:
- Leave the repo buildable and explain the new boundaries.

Actions:
- Final pass on dead imports and old paths
- Update notes in `ROOT_REFACTOR_PLAN.md`
- Keep old source only in `_unused`

Files touched:
- docs and cleanup paths as needed

Verification:
- final `npm run build`

Rollback:
- Restore last green state from backup if cleanup breaks the build.

Done when:
- Final build passes and the architecture is documented.

## 20. Verification Plan

Automated verification now:

```bash
npm run build
```

Scripts missing today and to be added later only if supported:

```bash
npm run typecheck
npm test
npm run lint
```

Manual checks required after Pixi migration:

- Game starts without blank screen
- Input drops the moving block correctly
- Pixi canvas renders at mobile and desktop sizes
- No passive listener errors
- No WebGL texture or destroy warnings
- Dashboard opens without remount bugs
- Settings opens without stopping the renderer unexpectedly
- Login modal opens if included
- Replay/reset does not leak listeners, tweens, or textures

## 21. Risk Register

| Risk | Why It Matters | Likelihood | Impact | Mitigation |
|---|---|---:|---:|---|
| Blank screen after Pixi migration | Core user path breaks | 3 | 5 | Add Pixi shell before removing Canvas path |
| React/Pixi state duplication | Causes jitter and logic bugs | 4 | 5 | Keep frame state in refs/core, not React state |
| GSAP memory leaks | Replay or navigation degrades performance | 3 | 4 | Centralize GSAP helpers and kill tweens on teardown |
| Generated texture leaks | WebGL memory usage grows | 3 | 5 | Track and destroy generated textures on resize/unmount |
| Design drift into generic UI | Violates game-first design goal | 3 | 4 | Reuse 2_2048 patterns and enforce token system |
| Overengineering backend | Slows delivery | 2 | 3 | Local storage service first, no unnecessary Firebase work |
| Mobile input regressions | Touch gameplay breaks | 3 | 5 | Normalize pointer/touch handling and test touch-action rules |
| Figma scaffold hidden dependencies | Cleanup can break build | 3 | 4 | Move in small blocks and rebuild after each block |
| Trailing-space path mistakes | File operations hit wrong directory | 2 | 5 | Use quoted exact root path in all commands |
| No git safety net | Harder rollback during refactor | 4 | 4 | Create timestamped backup before source edits |

## 22. Tech Debt Register

| Debt | Current Location | Why It Exists | Keep Temporarily? | Cleanup Phase |
|---|---|---|---|---|
| Monolithic game component | `src/app/components/StrawStackGame.tsx` | Prototype architecture | Yes | 4-8 |
| Scaffold UI library | `src/app/components/ui/*` | Figma/shadcn generation | Yes | 2 |
| Hidden design doc | `src/imports/pasted_text/design-system-doc.md` | Pasted export artifact | No | 3 |
| Generic theme tokens | `src/styles/theme.css` | Prototype defaults | Temporarily | 3 |
| Missing typecheck/test/lint | `package.json` | Prototype setup | No | 11 |
| Best score in component memory | `StrawStackGame.tsx` | No service boundary yet | Temporarily | 10 |
| No Pixi/GSAP deps yet | `package.json` | Canvas implementation still active | No | 6-8 |
| Inline overlay styling | current runtime and reference UI | Fast prototype output | Temporarily | 9 |

## 23. Acceptance Criteria

The refactor is accepted only if:

- `ROOT_REFACTOR_PLAN.md` exists at the repo root.
- `AGENTS.md` exists.
- A safety backup exists.
- PixiJS is integrated into the active runtime.
- Canvas/HTML5 realtime rendering is replaced or isolated into `_unused`.
- React no longer owns per-frame game/render state.
- Pure game logic is separated.
- UI overlays are separated from the renderer.
- GSAP cleanup exists if GSAP is used.
- Score persistence is behind services.
- Scaffold/dead generated UI is isolated.
- Final `npm run build` passes.

## 24. Agent Execution Checklist

- Read objective and current repo state
- Verify project root with trailing space
- Verify build baseline
- Create `ROOT_REFACTOR_PLAN.md`
- Create `AGENTS.md`
- Create safety backup
- Isolate scaffold
- Build design tokens and primitives
- Extract core and session layers
- Add Pixi runtime
- Replace Canvas runtime
- Add GSAP animation layer if needed
- Reconnect overlays and persistence
- Final verification

## 25. Approval Gate

This document was created from inspected evidence and is intended to drive the automatic execution run. The previous phase-by-phase approval gate is overridden only for this controlled refactor flow. Execution may continue automatically while the build passes and the repo remains restorable and buildable.
