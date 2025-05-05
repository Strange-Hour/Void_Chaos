import { System } from '../System';
import { Entity } from '../Entity';
import { Transform } from '../components/Transform';
import { Renderer } from '../components/Renderer';
import { Canvas } from '../../Canvas';
import { LayerName, getLayerLevel } from '@/config';

export class RenderSystem extends System {
  private canvas: Canvas;
  private gameLayer: CanvasRenderingContext2D;

  constructor(canvas: Canvas) {
    super(['transform', 'renderer']);
    this.canvas = canvas;

    // Create game layer using configuration
    const layer = this.canvas.createLayer(LayerName.Game, {
      zIndex: getLayerLevel(LayerName.Game)
    });
    if (!layer) {
      throw new Error('Failed to create game layer');
    }
    this.gameLayer = layer.getContext();
  }

  update(): void {
    // Clear the entire game layer first
    const canvasWidth = this.canvas.getWidth();
    const canvasHeight = this.canvas.getHeight();
    this.gameLayer.clearRect(0, 0, canvasWidth, canvasHeight);

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

        // Calculate centered position - sprites should be centered at the entity position
        const dimensions = sprite.getDimensions();
        const drawX = position.x - dimensions.width / 2;
        const drawY = position.y - dimensions.height / 2;

        // Only draw the sprite if it's ready
        if (sprite.isReady()) {
          // Draw the actual sprite - centered on the entity position
          sprite.draw(this.gameLayer, drawX, drawY, {
            alpha: renderer.getOpacity(),
            rotation: transform.getRotation()
          });
        }
      }
    }
  }

  /**
   * Add an entity to be processed by this system
   */
  addEntity(entity: Entity): void {
    super.addEntity(entity);

    // Force an immediate update to render new entity
    this.update();
  }
} 