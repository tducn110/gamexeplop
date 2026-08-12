# AGENTS.md

## Project Mission

Refactor this straw-stacking game from a monolithic React Canvas prototype into a buildable architecture with:

- Pure TypeScript game core
- PixiJS v8 realtime renderer
- React shell and overlays only
- Service boundaries for score persistence and future backend integration

## Source Of Truth Order

1. Current repo runtime path and build behavior
2. `/home/pro/Downloads/intern/LearningMaterials`
3. `/home/pro/Downloads/intern/1_FruitSlashing`
4. `/home/pro/Downloads/intern/2_2048`
5. `ROOT_REFACTOR_PLAN.md`

## Architecture Rules

- Keep pure game rules outside React, PixiJS, GSAP, DOM APIs, and storage.
- Keep PixiJS responsible for Application, canvas, stage, ticker, textures, sprites, effects, and continuous input/render lifecycle.
- Keep React responsible for shell, route/screen state, dashboard, settings, login, HUD overlays, and committed game status only.
- Keep persistence and leaderboard logic behind service wrappers.

## React / PixiJS Boundary

React may own:

- app shell
- layout
- screen state
- modal and panel state
- committed score/floor/best values
- game status
- settings
- leaderboard display

React must not own:

- per-frame positions
- sprite coordinates
- pointer movement state
- particle positions
- Pixi ticker state
- RAF loop state
- collision state

## GSAP Rules

- Use GSAP only in render animation modules.
- Do not place timelines inside random UI components.
- Kill tweens and timelines on reset, replay, sprite release, unmount, and app destroy.

## Design System Rules

- Use the warm paper/bamboo/orange design direction from the design document and `2_2048`.
- Keep the UI game-first, not landing-page-like.
- Prefer shared primitives for buttons, panels, and stat rows.

## Figma Triage Rules

- Treat generated Figma/shadcn code as scaffold until proven runtime-critical.
- Move dead scaffold into `_unused`; do not permanently delete in the first run.
- Rebuild after every cleanup block.

## CodeGraph Rules

- Use CodeGraph or direct file inspection before large structural edits.
- Confirm runtime paths and dependencies before moving files.

## Testing And Verification

Current automated verification:

```bash
npm run build
```

Add and run later only if tooling exists:

```bash
npm run typecheck
npm test
npm run lint
```

Run verification after each major migration block.

## Forbidden Shortcuts

- Do not redesign gameplay rules unless required by the Pixi migration.
- Do not import backend or storage code into core or render modules.
- Do not keep per-frame render state in React.
- Do not permanently delete old implementation files in the first run.
- Do not rename the project root folder unless absolutely required.

## Naming And Ownership

- `core/*`: pure logic only
- `logic/*`: concern-split helpers
- `state/*`: committed React state/session
- `input/*`: normalized gameplay intent
- `render/*`: Pixi and effect lifecycle
- `components/game-ui/*`: overlays and panels
- `components/ui/primitives/*`: reusable visual primitives

## Approval And Safety

- Create a timestamped backup before source edits.
- Keep the repo buildable after every major block.
- Continue automatically only while build verification passes or can be restored safely.
