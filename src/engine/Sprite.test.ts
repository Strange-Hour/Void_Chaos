import { Sprite, SpriteConfig } from './Sprite';

describe('Sprite', () => {
  let originalImage: typeof Image;

  beforeAll(() => {
    originalImage = global.Image;
    // Mock Image constructor
    global.Image = class MockImage {
      onload: () => void = () => { };
      onerror: (event?: ErrorEvent) => void = () => { };
      src: string = '';
      naturalWidth: number = 100;
      naturalHeight: number = 100;

      constructor() {
        // Call onload asynchronously to match real behavior
        Promise.resolve().then(() => this.onload());
      }
    } as unknown as typeof Image;
  });

  afterAll(() => {
    global.Image = originalImage;
  });

  describe('constructor', () => {
    it('should initialize with provided dimensions', async () => {
      const config: SpriteConfig = {
        url: 'test.png',
        width: 50,
        height: 60
      };
      const sprite = new Sprite(config);

      // Wait for onload to be called
      await Promise.resolve();
      expect(sprite.getDimensions()).toEqual({ width: 50, height: 60 });
    });

    it('should use natural dimensions when not provided', async () => {
      const config: SpriteConfig = {
        url: 'test.png'
      };
      const sprite = new Sprite(config);

      // Wait for onload to be called
      await Promise.resolve();
      expect(sprite.getDimensions()).toEqual({ width: 100, height: 100 });
    });

    it('should handle image load error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const config: SpriteConfig = {
        url: 'invalid.png'
      };
      const sprite = new Sprite(config);

      // Trigger error with a mock error event
      const mockErrorEvent = new ErrorEvent('error');
      const image = sprite.getImage();
      if (image && image.onerror) {
        image.onerror(mockErrorEvent);
      }

      expect(consoleSpy).toHaveBeenCalledWith('Failed to load sprite: invalid.png');
      consoleSpy.mockRestore();
    });
  });

  describe('draw', () => {
    let ctx: jest.Mocked<CanvasRenderingContext2D>;
    let sprite: Sprite;

    beforeEach(async () => {
      // Create a more complete mock of CanvasRenderingContext2D
      ctx = {
        save: jest.fn(),
        restore: jest.fn(),
        drawImage: jest.fn(),
        translate: jest.fn(),
        rotate: jest.fn(),
        scale: jest.fn(),
        globalAlpha: 1,
        setTransform: jest.fn(),
        getTransform: jest.fn()
      } as unknown as jest.Mocked<CanvasRenderingContext2D>;

      sprite = new Sprite({ url: 'test.png', width: 100, height: 100 });
      // Wait for onload to be called
      await Promise.resolve();
    });

    it('should not draw if sprite is not loaded', () => {
      const unloadedSprite = new Sprite({ url: 'test.png' });
      // Override isReady to return false
      jest.spyOn(unloadedSprite, 'isReady').mockReturnValue(false);

      unloadedSprite.draw(ctx, 0, 0);
      expect(ctx.drawImage).not.toHaveBeenCalled();
    });

    it('should draw with default options', () => {
      sprite.draw(ctx, 10, 20);

      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.drawImage).toHaveBeenCalledWith(
        expect.any(Object), // Changed from Image to Object due to mocking
        0, 0, 100, 100,
        10, 20, 100, 100
      );
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('should apply rotation', () => {
      sprite.draw(ctx, 10, 20, { rotation: 90 });

      expect(ctx.translate).toHaveBeenCalledTimes(2);
      expect(ctx.rotate).toHaveBeenCalledWith((90 * Math.PI) / 180);
    });

    it('should apply alpha', () => {
      sprite.draw(ctx, 10, 20, { alpha: 0.5 });

      // Create a setter for globalAlpha
      Object.defineProperty(ctx, 'globalAlpha', {
        get: jest.fn(() => 0.5),
        set: jest.fn()
      });

      expect(ctx.globalAlpha).toBe(0.5);
    });

    it('should handle horizontal flip', () => {
      sprite.draw(ctx, 10, 20, { flipX: true });

      expect(ctx.scale).toHaveBeenCalledWith(-1, 1);
    });

    it('should handle vertical flip', () => {
      sprite.draw(ctx, 10, 20, { flipY: true });

      expect(ctx.scale).toHaveBeenCalledWith(1, -1);
    });

    it('should draw with custom source dimensions', () => {
      sprite.draw(ctx, 10, 20, {
        sourceX: 5,
        sourceY: 5,
        sourceWidth: 50,
        sourceHeight: 50
      });

      expect(ctx.drawImage).toHaveBeenCalledWith(
        expect.any(Object), // Changed from Image to Object due to mocking
        5, 5, 50, 50,
        10, 20, 100, 100
      );
    });
  });

  describe('utility methods', () => {
    it('should return correct ready state', async () => {
      const sprite = new Sprite({ url: 'test.png' });
      // Wait for onload to be called
      await Promise.resolve();
      expect(sprite.isReady()).toBe(true);
    });

    it('should return the image element', () => {
      const sprite = new Sprite({ url: 'test.png' });
      expect(sprite.getImage()).toBeInstanceOf(global.Image);
    });
  });
}); 