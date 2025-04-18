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
  private lastFixedUpdateTime: number = 0;
  private readonly fixedTimeStep: number = 1 / 60; // 60 Hz fixed update rate
  private lastLoggedEntityCount: number = 0;
  private lastLoggedSystemCount: number = 0;

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
    console.log(`World.addEntity: Adding entity ${entity.getId()} with components:`,
      Array.from(entity.getComponents()).map(c => c.getType()));

    // Check if this is a player entity
    if (entity.hasComponent('player')) {
      // Check both processed entities and entities waiting to be added
      const existingPlayersInWorld = Array.from(this.entities).filter(e => e.hasComponent('player'));
      const pendingPlayersToAdd = this.entitiesToAdd.filter(e => e.hasComponent('player'));
      const totalExistingPlayers = existingPlayersInWorld.length + pendingPlayersToAdd.length;

      console.log(`World.addEntity: Found ${existingPlayersInWorld.length} existing players in world, ${pendingPlayersToAdd.length} pending players before adding new player`);

      if (totalExistingPlayers > 0) {
        console.warn(`World.addEntity: Attempting to add a player when ${totalExistingPlayers} already exist(s) (in world or pending). Blocking addition.`);
        console.trace('Stack trace for duplicate player addition:');
        return; // Prevent adding duplicate player
      }
    }

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
   * Get all systems in the world
   */
  getSystems(): System[] {
    return [...this.systems];
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
  processEntityChanges(): void {
    // Add new entities
    if (this.entitiesToAdd.length > 0) {
      console.log(`World.processEntityChanges: Processing ${this.entitiesToAdd.length} new entities`);

      for (const entity of this.entitiesToAdd) {
        if (entity.hasComponent('player')) {
          console.log('World.processEntityChanges: Processing player entity addition');
        }
        this.entities.add(entity);
        for (const system of this.systems) {
          if (system.shouldProcessEntity(entity)) {
            system.addEntity(entity);
          }
        }
      }
      this.entitiesToAdd = [];
    }

    // Remove entities
    if (this.entitiesToRemove.length > 0) {
      console.log(`World.processEntityChanges: Removing ${this.entitiesToRemove.length} entities`);

      for (const entity of this.entitiesToRemove) {
        this.entities.delete(entity);
        entity.dispose();
      }
      this.entitiesToRemove = [];
    }
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
      // Give higher priority to AI and Debug systems by ensuring they always update
      // with the most current state, even when delta time is small
      if (system.constructor.name === 'AIBehaviorSystem' ||
        system.constructor.name === 'DebugSystem') {
        // Force these systems to update with at least a minimum time step
        system.update(Math.max(dt, 16)); // Ensure at least ~60fps equivalent
      } else {
        system.update(dt);
      }
    }
  }

  /**
   * Fixed update method for physics and game logic
   * @param deltaTime Fixed time step in seconds
   */
  fixedUpdate(deltaTime: number): void {
    // Check if deltaTime is in milliseconds and convert if needed
    if (deltaTime > 1) {
      console.warn('World received large deltaTime - converting from ms to seconds:', deltaTime);
      deltaTime = deltaTime / 1000;
    }

    // Cap deltaTime to prevent unstable physics (max 100ms or 0.1s)
    const safeDeltatime = Math.min(deltaTime, 0.1);

    // Only log on substantial changes, not every frame
    const currentEntityCount = this.entities.size;
    const currentSystemCount = this.systems.length;

    if (currentEntityCount !== this.lastLoggedEntityCount ||
      currentSystemCount !== this.lastLoggedSystemCount) {
      console.log('World State Changed:', {
        deltaTime: safeDeltatime,
        systemCount: currentSystemCount,
        entityCount: currentEntityCount,
        change: {
          entities: currentEntityCount - this.lastLoggedEntityCount,
          systems: currentSystemCount - this.lastLoggedSystemCount
        }
      });
      this.lastLoggedEntityCount = currentEntityCount;
      this.lastLoggedSystemCount = currentSystemCount;
    }

    this.processEntityChanges();

    // Update systems with fixedUpdate methods
    for (const system of this.systems) {
      if (system.fixedUpdate) {
        system.fixedUpdate(safeDeltatime);
      }
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