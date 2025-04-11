import { Entity } from './Entity';
import { System } from './System';

/**
 * Core World class that manages all entities and systems in the ECS architecture.
 * The World is responsible for:
 * - Managing the lifecycle of entities
 * - Updating systems
 * - Maintaining the game state
 */
export class World {
  private entities: Set<Entity>;
  private systems: System[];
  private entitiesToAdd: Entity[];
  private entitiesToRemove: Entity[];
  private lastUpdateTime: number;

  constructor() {
    this.entities = new Set();
    this.systems = [];
    this.entitiesToAdd = [];
    this.entitiesToRemove = [];
    this.lastUpdateTime = performance.now();
  }

  /**
   * Add an entity to the world
   */
  addEntity(entity: Entity): void {
    this.entitiesToAdd.push(entity);
  }

  /**
   * Remove an entity from the world
   */
  removeEntity(entity: Entity): void {
    this.entitiesToRemove.push(entity);
  }

  /**
   * Add a system to the world
   */
  addSystem(system: System): void {
    this.systems.push(system);
  }

  /**
   * Remove a system from the world
   */
  removeSystem(system: System): void {
    const index = this.systems.indexOf(system);
    if (index !== -1) {
      this.systems.splice(index, 1);
    }
  }

  /**
   * Get all entities in the world
   */
  getEntities(): Entity[] {
    return Array.from(this.entities);
  }

  /**
   * Get entities that have all the specified component types
   */
  getEntitiesWith(...componentTypes: string[]): Entity[] {
    return this.getEntities().filter(entity =>
      componentTypes.every(type => entity.hasComponent(type))
    );
  }

  /**
   * Clear all entities and systems from the world
   */
  clear(): void {
    // Clean up all entities
    for (const entity of Array.from(this.entities)) {
      entity.dispose();
    }
    this.entities.clear();
    this.systems = [];
    this.entitiesToAdd = [];
    this.entitiesToRemove = [];
  }

  /**
   * Process entity additions and removals
   */
  private processEntityChanges(): void {
    // Add new entities
    for (const entity of this.entitiesToAdd) {
      this.entities.add(entity);
      // Notify systems of new entity
      for (const system of this.systems) {
        if (system.shouldProcessEntity(entity)) {
          system.addEntity(entity);
        }
      }
    }
    this.entitiesToAdd = [];

    // Remove entities
    for (const entity of this.entitiesToRemove) {
      this.entities.delete(entity);
      // Clean up entity
      entity.dispose();
    }
    this.entitiesToRemove = [];
  }

  /**
   * Update the world and all its systems
   */
  update(deltaTime?: number): void {
    const currentTime = performance.now();
    const dt = deltaTime ?? (currentTime - this.lastUpdateTime);
    this.lastUpdateTime = currentTime;

    // Process entity changes
    this.processEntityChanges();

    // Update all systems
    for (const system of this.systems) {
      system.update(dt);
    }
  }

  /**
   * Serialize the world state
   */
  serialize(): { entities: { id: number; components: { [key: string]: object } }[] } {
    return {
      entities: Array.from(this.entities).map(entity => entity.serialize() as {
        id: number;
        components: { [key: string]: object }
      })
    };
  }

  /**
   * Deserialize and restore world state
   */
  deserialize(data: { entities: { id: number; components: { [key: string]: object } }[] }): void {
    this.clear();
    for (const entityData of data.entities) {
      const entity = new Entity();
      entity.deserialize(entityData);
      this.addEntity(entity);
    }
  }
} 