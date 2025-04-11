import { Canvas } from './Canvas';

describe('Canvas', () => {
  let container: HTMLDivElement;
  let canvas: Canvas;
  const defaultConfig = {
    width: 800,
    height: 600
  };

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    canvas = new Canvas(defaultConfig);
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

  describe('render loop', () => {
    let rafCallback: (time: number) => void;
    let currentTime: number;

    beforeEach(() => {
      currentTime = 0;
      jest.useFakeTimers();

      // Mock performance.now to return our controlled time
      jest.spyOn(performance, 'now').mockImplementation(() => currentTime);

      // Mock requestAnimationFrame to capture callback and advance time
      jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
        rafCallback = cb;
        return 1;
      });
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    const advanceFrame = (deltaMs: number = 16.67) => {
      currentTime += deltaMs;
      rafCallback(currentTime);
    };

    it('should start and stop the render loop', () => {
      const spy = jest.spyOn(window, 'requestAnimationFrame');

      canvas.start();
      expect(spy).toHaveBeenCalled();

      canvas.stop();
      const lastCallCount = spy.mock.calls.length;
      advanceFrame();
      expect(spy.mock.calls.length).toBe(lastCallCount);
    });

    it('should execute render callbacks', () => {
      const callback = jest.fn();
      canvas.addRenderCallback(callback);
      canvas.start();

      advanceFrame(16.67); // First frame
      advanceFrame(16.67); // Second frame

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should remove render callbacks', () => {
      const callback = jest.fn();
      canvas.addRenderCallback(callback);
      canvas.start();

      advanceFrame(16.67);
      expect(callback).toHaveBeenCalledTimes(1);

      canvas.removeRenderCallback(callback);
      advanceFrame(16.67);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should respect target FPS', () => {
      canvas.setTargetFPS(30); // 33.33ms per frame
      const callback = jest.fn();
      canvas.addRenderCallback(callback);
      canvas.start();

      advanceFrame(32); // Less than one frame at 30 FPS
      expect(callback).not.toHaveBeenCalled();

      advanceFrame(2); // Complete the frame
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('performance monitoring', () => {
    let rafCallback: (time: number) => void;
    let currentTime: number;

    beforeEach(() => {
      currentTime = 0;
      jest.useFakeTimers();

      // Mock performance.now to return our controlled time
      jest.spyOn(performance, 'now').mockImplementation(() => currentTime);

      // Mock requestAnimationFrame to capture callback and advance time
      jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
        rafCallback = cb;
        return 1;
      });
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    const advanceFrame = (deltaMs: number = 16.67) => {
      currentTime += deltaMs;
      rafCallback(currentTime);
    };

    it('should track FPS and frame time', () => {
      canvas.start();

      // Simulate 60 frames over 1 second
      for (let i = 0; i < 60; i++) {
        advanceFrame(16.67);
      }

      const stats = canvas.getRenderStats();
      expect(stats.fps).toBeGreaterThan(0);
      expect(stats.frameTime).toBeGreaterThan(0);
    });

    it('should update FPS counter every second', () => {
      canvas.start();
      const initialStats = canvas.getRenderStats();

      // Advance less than a second
      for (let i = 0; i < 30; i++) {
        advanceFrame(16.67);
      }
      let stats = canvas.getRenderStats();
      expect(stats.fps).toBe(initialStats.fps);

      // Complete the second
      for (let i = 0; i < 30; i++) {
        advanceFrame(16.67);
      }
      stats = canvas.getRenderStats();
      expect(stats.fps).not.toBe(initialStats.fps);
    });
  });
}); 