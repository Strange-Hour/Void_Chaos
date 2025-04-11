import { System } from '../System';
import { Transform } from '../components/Transform';
import { Renderer } from '../components/Renderer';
import { Canvas } from '../../Canvas';

export class RenderSystem extends System {
  private canvas: Canvas;
  private gameLayer: CanvasRenderingContext2D;

  constructor(canvas: Canvas) {
    super(['transform', 'renderer']);
    this.canvas = canvas;
    const layer = this.canvas.createLayer('game', { zIndex: 1 });
    if (!layer) {
      throw new Error('Failed to create game layer');
    }
    this.gameLayer = layer.getContext();
  }

  update(): void {
    // Clear the game layer
    this.gameLayer.clearRect(0, 0, this.canvas.getWidth(), this.canvas.getHeight());

    // Sort entities by z-index
    const sortedEntities = Array.from(this.entities).sort((a, b) => {
      const rendererA = a.getComponent('renderer') as Renderer;
      const rendererB = b.getComponent('renderer') as Renderer;
      return rendererA.getZIndex() - rendererB.getZIndex();
    });

    // Render each entity
    for (const entity of sortedEntities) {
      const transform = entity.getComponent('transform') as Transform;
      const renderer = entity.getComponent('renderer') as Renderer;

      if (renderer.isVisible()) {
        const sprite = renderer.getSprite();
        const position = transform.getPosition();

        sprite.draw(this.gameLayer, position.x, position.y, {
          alpha: renderer.getOpacity(),
          rotation: transform.getRotation()
        });
      }
    }
  }
} 