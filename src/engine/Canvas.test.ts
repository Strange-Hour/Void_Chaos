import { Canvas } from './Canvas';

describe('Canvas', () => {
  let container: HTMLDivElement;
  let canvas: Canvas;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (canvas) {
      canvas.destroy();
    }
    container.remove();
  });

  describe('initialization', () => {
    it('should create canvas with specified dimensions', () => {
      // Arrange
      const width = 800;
      const height = 600;

      // Act
      canvas = new Canvas({
        width,
        height,
        containerId: 'test-container'
      });

      // Assert
      const dimensions = canvas.getDimensions();
      expect(dimensions.width).toBe(width);
      expect(dimensions.height).toBe(height);
    });

    it('should create default background layer', () => {
      // Arrange & Act
      canvas = new Canvas({
        width: 800,
        height: 600,
        containerId: 'test-container'
      });

      // Assert
      const backgroundLayer = canvas.getLayer('background');
      expect(backgroundLayer).toBeDefined();
      expect(backgroundLayer?.getZIndex()).toBe(0);
    });

    it('should throw error if container not found', () => {
      // Assert
      expect(() => {
        new Canvas({
          width: 800,
          height: 600,
          containerId: 'non-existent'
        });
      }).toThrow('Container with id "non-existent" not found');
    });
  });

  describe('layer management', () => {
    beforeEach(() => {
      canvas = new Canvas({
        width: 800,
        height: 600,
        containerId: 'test-container'
      });
    });

    it('should create new layer with specified z-index', () => {
      // Act
      const layer = canvas.createLayer('game', { zIndex: 1 });

      // Assert
      expect(layer).toBeDefined();
      expect(layer.getZIndex()).toBe(1);
      expect(canvas.getLayer('game')).toBe(layer);
    });

    it('should throw error when creating duplicate layer', () => {
      // Arrange
      canvas.createLayer('game');

      // Assert
      expect(() => {
        canvas.createLayer('game');
      }).toThrow('Layer "game" already exists');
    });

    it('should remove layer', () => {
      // Arrange
      canvas.createLayer('game');

      // Act
      const result = canvas.removeLayer('game');

      // Assert
      expect(result).toBe(true);
      expect(canvas.getLayer('game')).toBeUndefined();
    });

    it('should return false when removing non-existent layer', () => {
      // Act
      const result = canvas.removeLayer('non-existent');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should remove all layers on destroy', () => {
      // Arrange
      canvas = new Canvas({
        width: 800,
        height: 600,
        containerId: 'test-container'
      });
      canvas.createLayer('game');
      canvas.createLayer('ui');

      // Act
      canvas.destroy();

      // Assert
      expect(canvas.getLayer('background')).toBeUndefined();
      expect(canvas.getLayer('game')).toBeUndefined();
      expect(canvas.getLayer('ui')).toBeUndefined();
    });
  });
}); 