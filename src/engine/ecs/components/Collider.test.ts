import { Collider, CollisionBounds } from './Collider';
import { Vector2 } from './Transform';

describe('Collider', () => {
  let collider: Collider;
  const defaultBounds: CollisionBounds = {
    width: 100,
    height: 100,
    offset: { x: 0, y: 0 }
  };

  beforeEach(() => {
    collider = new Collider(defaultBounds);
  });

  it('should initialize with default options', () => {
    expect(collider.getBounds()).toEqual(defaultBounds);
    expect(collider.getLayer()).toBe(0);
    expect(collider.isTriggerCollider()).toBe(false);
    expect(collider.isStaticCollider()).toBe(false);
  });

  it('should initialize with custom options', () => {
    const customCollider = new Collider(defaultBounds, {
      layer: 1,
      isTrigger: true,
      isStatic: true
    });
    expect(customCollider.getLayer()).toBe(1);
    expect(customCollider.isTriggerCollider()).toBe(true);
    expect(customCollider.isStaticCollider()).toBe(true);
  });

  it('should return correct component type', () => {
    expect(collider.getType()).toBe('collider');
  });

  describe('bounds management', () => {
    it('should set and get bounds', () => {
      const newBounds: CollisionBounds = {
        width: 200,
        height: 150,
        offset: { x: 10, y: 20 }
      };
      collider.setBounds(newBounds);
      expect(collider.getBounds()).toEqual(newBounds);
    });

    it('should return a copy of bounds', () => {
      const bounds = collider.getBounds();
      bounds.width = 200;
      bounds.offset.x = 50;
      expect(collider.getBounds()).toEqual(defaultBounds);
    });
  });

  describe('layer management', () => {
    it('should set and get layer', () => {
      collider.setLayer(2);
      expect(collider.getLayer()).toBe(2);
    });
  });

  describe('trigger state', () => {
    it('should set and get trigger state', () => {
      collider.setTrigger(true);
      expect(collider.isTriggerCollider()).toBe(true);
      collider.setTrigger(false);
      expect(collider.isTriggerCollider()).toBe(false);
    });
  });

  describe('static state', () => {
    it('should set and get static state', () => {
      collider.setStatic(true);
      expect(collider.isStaticCollider()).toBe(true);
      collider.setStatic(false);
      expect(collider.isStaticCollider()).toBe(false);
    });
  });

  describe('collision detection', () => {
    let other: Collider;
    const position: Vector2 = { x: 0, y: 0 };

    beforeEach(() => {
      other = new Collider(defaultBounds);
    });

    it('should detect overlapping colliders', () => {
      const otherPosition: Vector2 = { x: 50, y: 50 };
      expect(collider.intersects(other, position, otherPosition)).toBe(true);
    });

    it('should detect non-overlapping colliders', () => {
      const otherPosition: Vector2 = { x: 200, y: 200 };
      expect(collider.intersects(other, position, otherPosition)).toBe(false);
    });

    it('should handle offset bounds', () => {
      const offsetBounds: CollisionBounds = {
        width: 100,
        height: 100,
        offset: { x: 50, y: 50 }
      };
      collider.setBounds(offsetBounds);
      const otherPosition: Vector2 = { x: 125, y: 125 };
      expect(collider.intersects(other, position, otherPosition)).toBe(true);
    });
  });

  describe('serialization', () => {
    it('should serialize all properties', () => {
      const serialized = collider.serialize() as {
        bounds: CollisionBounds;
        layer: number;
        isTrigger: boolean;
        isStatic: boolean;
      };
      expect(serialized.bounds).toEqual(defaultBounds);
      expect(serialized.layer).toBe(0);
      expect(serialized.isTrigger).toBe(false);
      expect(serialized.isStatic).toBe(false);
    });

    it('should deserialize all properties', () => {
      const data = {
        bounds: {
          width: 200,
          height: 150,
          offset: { x: 10, y: 20 }
        },
        layer: 2,
        isTrigger: true,
        isStatic: true
      };
      collider.deserialize(data);
      expect(collider.getBounds()).toEqual(data.bounds);
      expect(collider.getLayer()).toBe(data.layer);
      expect(collider.isTriggerCollider()).toBe(data.isTrigger);
      expect(collider.isStaticCollider()).toBe(data.isStatic);
    });

    it('should handle partial deserialization', () => {
      const data = {
        layer: 2,
        isTrigger: true
      };
      collider.deserialize(data);
      expect(collider.getBounds()).toEqual(defaultBounds);
      expect(collider.getLayer()).toBe(2);
      expect(collider.isTriggerCollider()).toBe(true);
      expect(collider.isStaticCollider()).toBe(false);
    });
  });
}); 