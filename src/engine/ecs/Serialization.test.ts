import { Entity, Component } from './Entity';
import { Serialization, SerializedEntity, SerializedGameState } from './Serialization';

// Test component implementation
class TestComponent extends Component {
  private value: number;

  constructor(value: number = 0) {
    super();
    this.value = value;
  }

  getType(): string {
    return 'test';
  }

  getValue(): number {
    return this.value;
  }

  serialize(): object {
    return { value: this.value };
  }

  deserialize(data: { value: number }): void {
    this.value = data.value;
  }
}

describe('Serialization', () => {
  let componentRegistry: Map<string, new () => Component>;
  let entity: Entity;
  let component: TestComponent;

  beforeEach(() => {
    componentRegistry = new Map();
    componentRegistry.set('test', TestComponent);

    entity = new Entity();
    component = new TestComponent(42);
    entity.addComponent(component);
  });

  describe('serializeEntity', () => {
    it('should serialize an entity with its components', () => {
      const serialized = Serialization.serializeEntity(entity);

      expect(serialized.id).toBe(entity.getId());
      expect(serialized.components.test).toEqual({ value: 42 });
    });
  });

  describe('deserializeEntity', () => {
    it('should deserialize an entity with its components', () => {
      const serialized: SerializedEntity = {
        id: 1,
        components: {
          test: { value: 42 }
        }
      };

      const deserialized = Serialization.deserializeEntity(serialized, componentRegistry);

      expect(deserialized.getId()).toBe(1);
      const component = deserialized.getComponent('test') as TestComponent;
      expect(component).toBeTruthy();
      expect(component.getValue()).toBe(42);
    });

    it('should warn about unknown component types', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const serialized: SerializedEntity = {
        id: 1,
        components: {
          unknown: { value: 42 }
        }
      };

      Serialization.deserializeEntity(serialized, componentRegistry);

      expect(consoleSpy).toHaveBeenCalledWith('Unknown component type: unknown');
      consoleSpy.mockRestore();
    });
  });

  describe('serializeGameState and deserializeGameState', () => {
    it('should serialize and deserialize game state', () => {
      const entities = [entity];
      const serialized = Serialization.serializeGameState(entities);
      const deserialized = Serialization.deserializeGameState(serialized, componentRegistry);

      expect(deserialized.length).toBe(1);
      const component = deserialized[0].getComponent('test') as TestComponent;
      expect(component.getValue()).toBe(42);
    });
  });

  describe('createStateSnapshot and restoreStateSnapshot', () => {
    it('should create and restore binary snapshots', () => {
      const state: SerializedGameState = {
        entities: [{
          id: 1,
          components: {
            test: { value: 42 }
          }
        }],
        timestamp: Date.now()
      };

      const snapshot = Serialization.createStateSnapshot(state);
      expect(snapshot).toBeInstanceOf(Uint8Array);

      const restored = Serialization.restoreStateSnapshot(snapshot);
      expect(restored).toEqual(state);
    });
  });

  describe('createStateDelta and applyStateDelta', () => {
    it('should create and apply state deltas', () => {
      const oldState: SerializedGameState = {
        entities: [{
          id: 1,
          components: {
            test: { value: 42 }
          }
        }],
        timestamp: 1000
      };

      const newState: SerializedGameState = {
        entities: [{
          id: 1,
          components: {
            test: { value: 43 }
          }
        }],
        timestamp: 2000
      };

      const delta = Serialization.createStateDelta(oldState, newState);
      expect(delta.entities).toHaveLength(1);
      expect(delta.timestamp).toBe(2000);

      const result = Serialization.applyStateDelta(oldState, delta);
      expect(result).toEqual(newState);
    });

    it('should handle entity deletion in deltas', () => {
      const oldState: SerializedGameState = {
        entities: [{
          id: 1,
          components: {
            test: { value: 42 }
          }
        }],
        timestamp: 1000
      };

      const newState: SerializedGameState = {
        entities: [],
        timestamp: 2000
      };

      const delta = Serialization.createStateDelta(oldState, newState);
      expect(delta.entities).toHaveLength(1);
      expect((delta.entities as SerializedEntity[])[0].components).toEqual({});

      const result = Serialization.applyStateDelta(oldState, delta);
      expect(result.entities).toHaveLength(0);
    });
  });
}); 