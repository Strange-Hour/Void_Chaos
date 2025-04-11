import { Entity } from './Entity';
import { Component } from './Entity';

/**
 * Interface for serialized entity data
 */
export interface SerializedEntity {
  id: number;
  components: {
    [type: string]: object;
  };
}

/**
 * Interface for serialized game state
 */
export interface SerializedGameState {
  entities: SerializedEntity[];
  timestamp: number;
}

/**
 * Interface for state delta
 */
export interface StateDelta {
  entities: SerializedEntity[];
  timestamp: number;
}

/**
 * Utility class for serializing and deserializing game state
 */
export class Serialization {
  /**
   * Serialize an entity to a plain object
   */
  static serializeEntity(entity: Entity): SerializedEntity {
    const components: { [type: string]: object } = {};

    entity.getAllComponents().forEach(component => {
      components[component.getType()] = component.serialize();
    });

    return {
      id: entity.getId(),
      components
    };
  }

  /**
   * Deserialize an entity from a plain object
   */
  static deserializeEntity(data: SerializedEntity, componentRegistry: Map<string, new () => Component>): Entity {
    const entity = new Entity(data.id);

    Object.entries(data.components).forEach(([type, componentData]) => {
      const ComponentClass = componentRegistry.get(type);
      if (ComponentClass) {
        const component = new ComponentClass();
        component.deserialize(componentData);
        entity.addComponent(component);
      } else {
        console.warn(`Unknown component type: ${type}`);
      }
    });

    return entity;
  }

  /**
   * Serialize game state to a plain object
   */
  static serializeGameState(entities: Entity[]): SerializedGameState {
    return {
      entities: entities.map(entity => this.serializeEntity(entity)),
      timestamp: Date.now()
    };
  }

  /**
   * Deserialize game state from a plain object
   */
  static deserializeGameState(state: SerializedGameState, componentRegistry: Map<string, new () => Component>): Entity[] {
    return state.entities.map(entityData => this.deserializeEntity(entityData, componentRegistry));
  }

  /**
   * Create a binary snapshot of the game state
   */
  static createStateSnapshot(state: SerializedGameState): Uint8Array {
    const jsonString = JSON.stringify(state);
    const encoder = new TextEncoder();
    return encoder.encode(jsonString);
  }

  /**
   * Restore game state from a binary snapshot
   */
  static restoreStateSnapshot(snapshot: Uint8Array): SerializedGameState {
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(snapshot);
    return JSON.parse(jsonString);
  }

  /**
   * Create a delta between two game states
   */
  static createStateDelta(oldState: SerializedGameState, newState: SerializedGameState): StateDelta {
    const delta: StateDelta = {
      entities: [],
      timestamp: newState.timestamp
    };

    // Create a map of old entities by ID
    const oldEntitiesMap = new Map(oldState.entities.map(e => [e.id, e]));
    const newEntitiesMap = new Map(newState.entities.map(e => [e.id, e]));

    // Find modified and deleted entities
    oldEntitiesMap.forEach((oldEntity, id) => {
      const newEntity = newEntitiesMap.get(id);
      if (!newEntity) {
        // Entity was deleted
        delta.entities.push({ id, components: {} });
      } else {
        // Check for component changes
        const changes: { [type: string]: object } = {};
        let hasChanges = false;

        Object.entries(oldEntity.components).forEach(([type, oldData]) => {
          const newData = newEntity.components[type];
          if (!newData || JSON.stringify(oldData) !== JSON.stringify(newData)) {
            changes[type] = newData || {};
            hasChanges = true;
          }
        });

        Object.entries(newEntity.components).forEach(([type, newData]) => {
          if (!oldEntity.components[type]) {
            changes[type] = newData;
            hasChanges = true;
          }
        });

        if (hasChanges) {
          delta.entities.push({ id, components: changes });
        }
      }
    });

    // Find new entities
    newEntitiesMap.forEach((newEntity, id) => {
      if (!oldEntitiesMap.has(id)) {
        delta.entities.push(newEntity);
      }
    });

    return delta;
  }

  /**
   * Apply a delta to a game state
   */
  static applyStateDelta(oldState: SerializedGameState, delta: StateDelta): SerializedGameState {
    const newState: SerializedGameState = {
      entities: [...oldState.entities],
      timestamp: delta.timestamp
    };

    const entitiesMap = new Map(newState.entities.map(e => [e.id, e]));

    delta.entities.forEach(deltaEntity => {
      const existingEntity = entitiesMap.get(deltaEntity.id);

      if (Object.keys(deltaEntity.components).length === 0) {
        // Entity was deleted
        entitiesMap.delete(deltaEntity.id);
      } else if (existingEntity) {
        // Update existing entity
        existingEntity.components = {
          ...existingEntity.components,
          ...deltaEntity.components
        };
      } else {
        // New entity
        entitiesMap.set(deltaEntity.id, deltaEntity);
      }
    });

    newState.entities = Array.from(entitiesMap.values());
    return newState;
  }
} 