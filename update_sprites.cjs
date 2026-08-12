const fs = require('fs');
const path = require('path');

const spritesPath = path.join(__dirname, 'src/features/game/render/pixi/sprites.ts');
let content = fs.readFileSync(spritesPath, 'utf8');

// add Graphics to imports
content = content.replace(/import { Graphics, Sprite, Text, type Container } from "pixi.js";/, 'import { Graphics, Sprite, Text, type Container, Texture } from "pixi.js";');

// add perfectHighlight to SpriteRegistry
content = content.replace(
  `  comboText: Text | null;
}`,
  `  comboText: Text | null;
  perfectHighlight: Graphics | null;
}`
);

// add to createSpriteRegistry
content = content.replace(
  `    comboText: null,
  };`,
  `    comboText: null,
    perfectHighlight: null,
  };`
);

// add sync logic for perfectHighlight
const renderEndIdx = content.indexOf('export function destroySpriteRegistry');
const perfectHighlightRender = `
  if (state.perfectHighlight) {
    if (!registry.perfectHighlight) {
      registry.perfectHighlight = new Graphics();
      layer.addChild(registry.perfectHighlight);
    }
    registry.perfectHighlight.clear();
    // highlight should expand outward. Let's say h expands too:
    const baseH = BLOCK_HEIGHT;
    // to calculate h expansion from alpha: alpha goes 1 -> 0 over 20 frames.
    // so 1 - alpha is progress 0 -> 1.
    const progress = 1 - state.perfectHighlight.alpha;
    const h = baseH + progress * 20; 
    const yOffset = -progress * 10;
    
    registry.perfectHighlight.rect(
      state.perfectHighlight.x,
      state.perfectHighlight.y + yOffset,
      state.perfectHighlight.w,
      h
    );
    registry.perfectHighlight.fill({ color: 0xffffff, alpha: Math.max(0, state.perfectHighlight.alpha * 0.7) });
    registry.perfectHighlight.visible = true;
  } else if (registry.perfectHighlight) {
    registry.perfectHighlight.visible = false;
  }
`;

content = content.substring(0, renderEndIdx) + perfectHighlightRender + '\n' + content.substring(renderEndIdx);

// add to destroySpriteRegistry
content = content.replace(
  `  registry.comboText?.destroy();
}`,
  `  registry.comboText?.destroy();
  registry.perfectHighlight?.destroy();
}`
);

fs.writeFileSync(spritesPath, content);
console.log("sprites.ts updated successfully");
