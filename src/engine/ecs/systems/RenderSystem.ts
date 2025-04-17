import { System } from '../System';
import { Transform } from '../components/Transform';
import { Renderer } from '../components/Renderer';
import { Canvas } from '../../Canvas';
import { Entity } from '../Entity';

export class RenderSystem extends System {
  private canvas: Canvas;
  private gameLayer: CanvasRenderingContext2D;

  constructor(canvas: Canvas) {
    super(['transform', 'renderer']);
    this.canvas = canvas;

    // Check if game layer already exists
    let layer = this.canvas.getLayer('game');

    // Only create the layer if it doesn't exist
    if (!layer) {
      console.log('Game layer not found, creating new one');
      layer = this.canvas.createLayer('game', { zIndex: 1 });
    } else {
      console.log('Using existing game layer');
    }

    if (!layer) {
      throw new Error('Failed to get or create game layer');
    }

    // Ensure the layer is properly set up
    layer.setVisible(true);
    const layerCanvas = layer.getCanvas();
    layerCanvas.style.display = 'block';
    layerCanvas.style.position = 'absolute';
    layerCanvas.style.top = '0';
    layerCanvas.style.left = '0';

    this.gameLayer = layer.getContext();

    // Verify canvas dimensions
    console.log('Game layer canvas dimensions:', {
      canvas: layerCanvas,
      width: layerCanvas.width,
      height: layerCanvas.height,
      style: {
        width: layerCanvas.style.width,
        height: layerCanvas.style.height,
        display: layerCanvas.style.display,
        position: layerCanvas.style.position,
      }
    });

    console.log('RenderSystem initialized with game layer');
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