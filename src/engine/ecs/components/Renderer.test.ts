import { Renderer, RenderOptions } from './Renderer';
import { Sprite } from '../../Sprite';

jest.mock('../../Sprite');

describe('Renderer', () => {
  let renderer: Renderer;
  let mockSprite: jest.Mocked<Sprite>;

  beforeEach(() => {
    // Create a mock sprite
    mockSprite = new Sprite({ url: 'test.png' }) as jest.Mocked<Sprite>;
    mockSprite.getImage = jest.fn().mockReturnValue({ src: 'test.png' });

    renderer = new Renderer(mockSprite);
  });

  it('should initialize with default options', () => {
    expect(renderer.isVisible()).toBe(true);
    expect(renderer.getOpacity()).toBe(1);
    expect(renderer.getZIndex()).toBe(0);
  });

  it('should initialize with custom options', () => {
    const options: Partial<RenderOptions> = {
      visible: false,
      opacity: 0.5,
      zIndex: 2
    };
    renderer = new Renderer(mockSprite, options);
    expect(renderer.isVisible()).toBe(false);
    expect(renderer.getOpacity()).toBe(0.5);
    expect(renderer.getZIndex()).toBe(2);
  });

  it('should return correct component type', () => {
    expect(renderer.getType()).toBe('renderer');
  });

  describe('sprite management', () => {
    it('should get and set sprite', () => {
      const newSprite = new Sprite({ url: 'new.png' });
      renderer.setSprite(newSprite);
      expect(renderer.getSprite()).toBe(newSprite);
    });
  });

  describe('visibility operations', () => {
    it('should set and get visibility', () => {
      renderer.setVisible(false);
      expect(renderer.isVisible()).toBe(false);
      renderer.setVisible(true);
      expect(renderer.isVisible()).toBe(true);
    });
  });

  describe('opacity operations', () => {
    it('should set and get opacity', () => {
      renderer.setOpacity(0.5);
      expect(renderer.getOpacity()).toBe(0.5);
    });

    it('should clamp opacity between 0 and 1', () => {
      renderer.setOpacity(-0.5);
      expect(renderer.getOpacity()).toBe(0);
      renderer.setOpacity(1.5);
      expect(renderer.getOpacity()).toBe(1);
    });
  });

  describe('z-index operations', () => {
    it('should set and get z-index', () => {
      renderer.setZIndex(5);
      expect(renderer.getZIndex()).toBe(5);
    });
  });

  describe('serialization', () => {
    it('should serialize all properties', () => {
      const serialized = renderer.serialize() as {
        spriteUrl: string;
        options: RenderOptions;
      };
      expect(serialized.spriteUrl).toBe('test.png');
      expect(serialized.options).toEqual({
        visible: true,
        opacity: 1,
        zIndex: 0
      });
    });

    it('should deserialize options', () => {
      const data = {
        spriteUrl: 'new.png',
        options: {
          visible: false,
          opacity: 0.7,
          zIndex: 3
        }
      };
      renderer.deserialize(data);
      expect(renderer.isVisible()).toBe(false);
      expect(renderer.getOpacity()).toBe(0.7);
      expect(renderer.getZIndex()).toBe(3);
    });

    it('should handle partial deserialization', () => {
      const data = {
        options: {
          visible: false
        }
      };
      renderer.deserialize(data);
      expect(renderer.isVisible()).toBe(false);
      expect(renderer.getOpacity()).toBe(1); // Unchanged
      expect(renderer.getZIndex()).toBe(0); // Unchanged
    });
  });
}); 