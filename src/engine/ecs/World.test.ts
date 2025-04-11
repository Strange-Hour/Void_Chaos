import { World } from './World';
import { Entity } from './Entity';
import { System } from './System';

describe('World', () => {
  let world: World;

  beforeEach(() => {
    world = new World();
  });

  describe('Entity Management', () => {
    it('should add entities', () => {
      const entity = new Entity();
      world.addEntity(entity);
      world.update(); // Process entity changes
      expect(world.getEntities()).toContain(entity);
    });

    it('should remove entities', () => {
      const entity = new Entity();
      world.addEntity(entity);
      world.update(); // Process entity changes
      world.removeEntity(entity);
      world.update(); // Process entity changes
      expect(world.getEntities()).not.toContain(entity);
    });

    it('should get entities with specific components', () => {
      const entity1 = new Entity();
      const entity2 = new Entity();

      entity1.addComponent({ getType: () => 'test1' });
      entity2.addComponent({ getType: () => 'test2' });

      world.addEntity(entity1);
      world.addEntity(entity2);
      world.update();

      const entitiesWithTest1 = world.getEntitiesWith('test1');
      expect(entitiesWithTest1).toContain(entity1);
      expect(entitiesWithTest1).not.toContain(entity2);
    });
  });

  describe('System Management', () => {
    class TestSystem extends System {
      update(deltaTime: number): void {
        // Test implementation
      }
    }

    it('should add systems', () => {
      const system = new TestSystem(['test']);
      world.addSystem(system);
      world.update();
      // Verify system was added by checking if it processes entities
      const entity = new Entity();
      entity.addComponent({ getType: () => 'test' });
      world.addEntity(entity);
      world.update();
      expect(system['entities'].has(entity)).toBe(true);
    });

    it('should remove systems', () => {
      const system = new TestSystem(['test']);
      world.addSystem(system);
      world.removeSystem(system);
      // Verify system was removed
      const entity = new Entity();
      entity.addComponent({ getType: () => 'test' });
      world.addEntity(entity);
      world.update();
      expect(system['entities'].has(entity)).toBe(false);
    });
  });

  describe('World Updates', () => {
    it('should update systems with correct delta time', () => {
      const mockSystem = {
        filter: () => true,
        addEntity: () => { },
        update: jest.fn()
      };

      world.addSystem(mockSystem as unknown as System);
      world.update();

      expect(mockSystem.update).toHaveBeenCalled();
      const deltaTime = mockSystem.update.mock.calls[0][0];
      expect(typeof deltaTime).toBe('number');
      expect(deltaTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize world state', () => {
      const entity = new Entity();
      entity.addComponent({
        getType: () => 'test',
        serialize: () => ({ type: 'test', data: 123 }),
        deserialize: () => { }
      });

      world.addEntity(entity);
      world.update();

      const serialized = world.serialize();
      expect(serialized).toHaveProperty('entities');
      expect(Array.isArray(serialized.entities)).toBe(true);

      const newWorld = new World();
      newWorld.deserialize(serialized);
      newWorld.update();

      expect(newWorld.getEntities().length).toBe(1);
      expect(newWorld.getEntitiesWith('test').length).toBe(1);
    });
  });

  describe('World Clear', () => {
    it('should clear all entities and systems', () => {
      const entity = new Entity();
      const system = new TestSystem(['test']);

      world.addEntity(entity);
      world.addSystem(system);
      world.update();

      world.clear();

      expect(world.getEntities().length).toBe(0);
      // Add a new entity to verify systems are cleared
      const newEntity = new Entity();
      newEntity.addComponent({ getType: () => 'test' });
      world.addEntity(newEntity);
      world.update();
      expect(system['entities'].has(newEntity)).toBe(false);
    });
  });
}); 