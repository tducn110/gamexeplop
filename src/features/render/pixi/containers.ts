import { Container, Graphics } from "pixi.js";

export interface StageLayers {
  root: Container;
  background: Container;
  world: Container;
  effects: Container;
  sparkGraphics: Graphics;
}

export function createStageLayers() {
  const root = new Container();
  const background = new Container();
  const world = new Container();
  const effects = new Container();
  const sparkGraphics = new Graphics();

  effects.addChild(sparkGraphics);
  root.addChild(background, world, effects);

  return { root, background, world, effects, sparkGraphics } satisfies StageLayers;
}
