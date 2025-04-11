import { Layer } from './Layer';

describe('Layer', () => {
  let layer: Layer;

  afterEach(() => {
    if (layer) {
      layer.getCanvas().remove();
    }
  });

  describe('initialization', () => {
    it('should create layer with specified dimensions', () => {
      // Arrange & Act
      layer = new Layer({
        width: 800,
        height: 600,
        zIndex: 1
      });

      // Assert
      const dimensions = layer.getDimensions();
      expect(dimensions.width).toBe(800);
      expect(dimensions.height).toBe(600);
    });

    it('should set correct z-index', () => {
      // Arrange & Act
      layer = new Layer({
        width: 800,
        height: 600,
        zIndex: 2
      });

      // Assert
      expect(layer.getZIndex()).toBe(2);
      expect(layer.getCanvas().style.zIndex).toBe('2');
    });

    it('should be visible by default', () => {
      // Arrange & Act
      layer = new Layer({
        width: 800,
        height: 600,
        zIndex: 1
      });

      // Assert
      expect(layer.isLayerVisible()).toBe(true);
      expect(layer.getCanvas().style.display).toBe('block');
    });

    it('should respect initial visibility setting', () => {
      // Arrange & Act
      layer = new Layer({
        width: 800,
        height: 600,
        zIndex: 1,
        isVisible: false
      });

      // Assert
      expect(layer.isLayerVisible()).toBe(false);
      expect(layer.getCanvas().style.display).toBe('none');
    });
  });

  describe('visibility management', () => {
    beforeEach(() => {
      layer = new Layer({
        width: 800,
        height: 600,
        zIndex: 1
      });
    });

    it('should toggle visibility', () => {
      // Act
      layer.setVisible(false);

      // Assert
      expect(layer.isLayerVisible()).toBe(false);
      expect(layer.getCanvas().style.display).toBe('none');

      // Act
      layer.setVisible(true);

      // Assert
      expect(layer.isLayerVisible()).toBe(true);
      expect(layer.getCanvas().style.display).toBe('block');
    });
  });

  describe('z-index management', () => {
    beforeEach(() => {
      layer = new Layer({
        width: 800,
        height: 600,
        zIndex: 1
      });
    });

    it('should update z-index', () => {
      // Act
      layer.setZIndex(3);

      // Assert
      expect(layer.getZIndex()).toBe(3);
      expect(layer.getCanvas().style.zIndex).toBe('3');
    });
  });

  describe('canvas operations', () => {
    beforeEach(() => {
      layer = new Layer({
        width: 800,
        height: 600,
        zIndex: 1
      });
    });

    it('should provide access to context', () => {
      // Act
      const ctx = layer.getContext();

      // Assert
      expect(ctx).toBeDefined();
    });

    it('should clear the canvas', () => {
      // Arrange
      const ctx = layer.getContext();
      const clearRectSpy = jest.spyOn(ctx, 'clearRect');

      // Act
      layer.clear();

      // Assert
      expect(clearRectSpy).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it('should resize the canvas', () => {
      // Act
      layer.resize(400, 300);

      // Assert
      const dimensions = layer.getDimensions();
      expect(dimensions.width).toBe(400);
      expect(dimensions.height).toBe(300);
      expect(layer.getCanvas().style.width).toBe('400px');
      expect(layer.getCanvas().style.height).toBe('300px');
    });
  });
}); 