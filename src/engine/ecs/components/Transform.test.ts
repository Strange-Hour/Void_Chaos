import { Transform, Vector2 } from './Transform';

describe('Transform', () => {
  let transform: Transform;
  const initialPosition: Vector2 = { x: 10, y: 20 };
  const initialRotation = 45;
  const initialScale: Vector2 = { x: 2, y: 3 };

  beforeEach(() => {
    transform = new Transform(initialPosition, initialRotation, initialScale);
  });

  it('should initialize with default values when no parameters are provided', () => {
    const defaultTransform = new Transform();
    expect(defaultTransform.getPosition()).toEqual({ x: 0, y: 0 });
    expect(defaultTransform.getRotation()).toBe(0);
    expect(defaultTransform.getScale()).toEqual({ x: 1, y: 1 });
  });

  it('should initialize with provided values', () => {
    expect(transform.getPosition()).toEqual(initialPosition);
    expect(transform.getRotation()).toBe(initialRotation);
    expect(transform.getScale()).toEqual(initialScale);
  });

  it('should return correct component type', () => {
    expect(transform.getType()).toBe('transform');
  });

  describe('position operations', () => {
    it('should set and get position', () => {
      const newPosition: Vector2 = { x: 30, y: 40 };
      transform.setPosition(newPosition);
      expect(transform.getPosition()).toEqual(newPosition);
    });

    it('should translate position', () => {
      const delta: Vector2 = { x: 5, y: -3 };
      const expectedPosition: Vector2 = {
        x: initialPosition.x + delta.x,
        y: initialPosition.y + delta.y
      };
      transform.translate(delta);
      expect(transform.getPosition()).toEqual(expectedPosition);
    });

    it('should return a copy of position', () => {
      const position = transform.getPosition();
      position.x = 100;
      expect(transform.getPosition()).toEqual(initialPosition);
    });
  });

  describe('rotation operations', () => {
    it('should set and get rotation', () => {
      const newRotation = 90;
      transform.setRotation(newRotation);
      expect(transform.getRotation()).toBe(newRotation);
    });

    it('should rotate by delta', () => {
      const delta = 30;
      transform.rotate(delta);
      expect(transform.getRotation()).toBe(initialRotation + delta);
    });
  });

  describe('scale operations', () => {
    it('should set and get scale', () => {
      const newScale: Vector2 = { x: 4, y: 5 };
      transform.setScale(newScale);
      expect(transform.getScale()).toEqual(newScale);
    });

    it('should return a copy of scale', () => {
      const scale = transform.getScale();
      scale.x = 100;
      expect(transform.getScale()).toEqual(initialScale);
    });
  });

  describe('serialization', () => {
    it('should serialize all properties', () => {
      const serialized = transform.serialize() as {
        position: Vector2;
        rotation: number;
        scale: Vector2;
      };
      expect(serialized.position).toEqual(initialPosition);
      expect(serialized.rotation).toBe(initialRotation);
      expect(serialized.scale).toEqual(initialScale);
    });

    it('should deserialize all properties', () => {
      const newTransform = new Transform();
      const data = {
        position: { x: 15, y: 25 },
        rotation: 60,
        scale: { x: 1.5, y: 2.5 }
      };
      newTransform.deserialize(data);
      expect(newTransform.getPosition()).toEqual(data.position);
      expect(newTransform.getRotation()).toBe(data.rotation);
      expect(newTransform.getScale()).toEqual(data.scale);
    });

    it('should handle partial deserialization', () => {
      const data = { position: { x: 15, y: 25 } };
      transform.deserialize(data);
      expect(transform.getPosition()).toEqual(data.position);
      expect(transform.getRotation()).toBe(initialRotation);
      expect(transform.getScale()).toEqual(initialScale);
    });
  });
}); 