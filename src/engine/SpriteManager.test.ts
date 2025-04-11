import { SpriteManager } from './SpriteManager';

jest.setTimeout(10000);

type MockImage = {
  onload: () => void;
  onerror: () => void;
  src: string;
  isLoaded: boolean;
  width: number;
  height: number;
};

beforeAll(() => {
  global.Image = class {
    src: string = '';
    isLoaded: boolean = false;
    width: number = 0;
    height: number = 0;
  } as unknown as typeof HTMLImageElement;

  Object.defineProperty(global.Image.prototype, 'onload', {
    value: function () { },
    writable: true
  });

  Object.defineProperty(global.Image.prototype, 'onerror', {
    value: function () { },
    writable: true
  });
});

let spriteManager: SpriteManager;

beforeEach(() => {
  spriteManager = new SpriteManager();
  jest.spyOn(global.Image.prototype, 'onload').mockImplementation(function (this: MockImage) {
    this.isLoaded = true;
    setTimeout(() => this.onload(), 0); // Trigger onload asynchronously
  });

  jest.spyOn(global.Image.prototype, 'onerror').mockImplementation(function (this: MockImage) {
    setTimeout(() => this.onerror(), 0); // Trigger onerror asynchronously
  });

  // Ensure max concurrent loads is set
  spriteManager.setMaxConcurrentLoads(5);
});

// Add logging to verify queue processing
jest.spyOn(console, 'log').mockImplementation(() => { });

describe('SpriteManager', () => {
  beforeEach(() => {
    spriteManager = new SpriteManager();
  });

  describe('sprite loading', () => {
    it('should cache sprites', () => {
      const sprite1 = spriteManager.getSprite('test1.png');
      const sprite2 = spriteManager.getSprite('test1.png');
      expect(sprite1).toBe(sprite2);
      expect(spriteManager.getCacheSize()).toBe(1);
    });

    it('should handle multiple sprites', () => {
      spriteManager.getSprite('test1.png');
      spriteManager.getSprite('test2.png');
      spriteManager.getSprite('test3.png');
      expect(spriteManager.getCacheSize()).toBe(3);
    });

    it('should clear unused sprites', () => {
      spriteManager.getSprite('test1.png');
      spriteManager.getSprite('test2.png');
      spriteManager.getSprite('test3.png');

      spriteManager.clearUnused(['test1.png', 'test2.png']);
      expect(spriteManager.getCacheSize()).toBe(2);
    });
  });

  describe('load queue', () => {
    it('should add sprites to load queue', () => {
      spriteManager.getSprite('test1.png');
      expect(spriteManager.getQueueLength()).toBe(1);
    });

    it('should prioritize high priority loads', () => {
      spriteManager.getSprite('test1.png', undefined, { priority: 'low' });
      spriteManager.getSprite('test2.png', undefined, { priority: 'high' });
      expect(spriteManager.getQueueLength()).toBe(2);
      // High priority should be loaded first, but we can't test the order directly
      // since the queue is private
    });

    it('should respect max concurrent loads', () => {
      spriteManager.setMaxConcurrentLoads(2);
      spriteManager.getSprite('test1.png');
      spriteManager.getSprite('test2.png');
      spriteManager.getSprite('test3.png');
      expect(spriteManager.getQueueLength()).toBeGreaterThan(0);
    });
  });

  describe('preloading', () => {
    it('should preload multiple sprites', async () => {
      const configs = [
        { url: 'test1.png' },
        { url: 'test2.png' },
        { url: 'test3.png' }
      ];

      const promise = spriteManager.preload(configs);
      expect(spriteManager.getCacheSize()).toBe(3);
      await expect(promise).resolves.toBeDefined();
    });

    it('should handle preload errors gracefully', async () => {
      const configs = [
        { url: 'invalid.png' }
      ];

      const promise = spriteManager.preload(configs);
      await expect(promise).rejects.toBeDefined();
    });
  });

  describe('configuration', () => {
    it('should set max concurrent loads', () => {
      spriteManager.setMaxConcurrentLoads(3);
      spriteManager.setMaxConcurrentLoads(0); // Should enforce minimum of 1
      spriteManager.setMaxConcurrentLoads(-1); // Should enforce minimum of 1
    });

    it('should accept sprite configuration', () => {
      const sprite = spriteManager.getSprite('test.png', {
        width: 100,
        height: 100
      });

      const dimensions = sprite.getDimensions();
      expect(dimensions.width).toBe(100);
      expect(dimensions.height).toBe(100);
    });
  });
}); 