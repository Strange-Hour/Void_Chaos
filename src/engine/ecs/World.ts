import { Entity } from './Entity';
import { System } from './System';
import { Grid } from './pathfinding/Grid';
import { Collider } from './components/Collider';
import { Transform } from './components/Transform';

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
  private width: number;
  private height: number;
  private padding: number;
  private cellSize: number;
  private grid: Grid;

  /**
   * @param width World width in world units (e.g., pixels)
   * @param height World height in world units
   * @param padding Padding from edge for boundaries
   * @param cellSize Size of each grid cell (default 32)
   */
  constructor(width: number = 800, height: number = 600, padding: number = 40, cellSize: number = 32) {
    this.width = width;
    this.height = height;
    this.padding = padding;
    this.cellSize = cellSize;
    this.grid = new Grid(
      Math.ceil(width / cellSize),
      Math.ceil(height / cellSize),
      cellSize
    );
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

    // Check if this is a player entity
    if (entity.hasComponent('player')) {
      // Check both processed entities and entities waiting to be added
      const existingPlayersInWorld = Array.from(this.entities).filter(e => e.hasComponent('player'));
      const pendingPlayersToAdd = this.entitiesToAdd.filter(e => e.hasComponent('player'));
      const totalExistingPlayers = existingPlayersInWorld.length + pendingPlayersToAdd.length;

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
    // Add existing entities using forEach for broader compatibility
    this.entities.forEach(entity => {
      if (system.shouldProcessEntity(entity)) {
        system.addEntity(entity);
      }
    });
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
      for (const entity of this.entitiesToAdd) {
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
      for (const entity of this.entitiesToRemove) {
        this.entities.delete(entity);
        entity.dispose();
      }
      this.entitiesToRemove = [];
    }
    // Update grid after any entity changes
    this.updateGridFromObstacles();
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

  /**
   * Get the pathfinding grid (updated for current obstacles)
   */
  getGrid(): Grid {
    return this.grid;
  }

  /**
   * Update the grid's walkability based on static colliders in the world
   * Should be called after entity changes or obstacle updates
   */
  updateGridFromObstacles(): void {
    // Reset all cells to walkable
    for (let y = 0; y < this.grid.getHeight(); y++) {
      for (let x = 0; x < this.grid.getWidth(); x++) {
        this.grid.setWalkable(x, y, true);
      }
    }
    // Mark cells as blocked for each static, non-trigger collider
    this.entities.forEach(entity => {
      if (entity.hasComponent('collider') && entity.hasComponent('transform')) {
        const collider = entity.getComponent('collider') as Collider;
        if (collider.isStaticCollider() && !collider.isTriggerCollider()) {
          const transform = entity.getComponent('transform') as Transform;
          const pos = transform.getPosition();
          const bounds = collider.getBounds();
          // Calculate collider world bounds
          const left = pos.x + bounds.offset.x;
          const top = pos.y + bounds.offset.y;
          const right = left + bounds.width;
          const bottom = top + bounds.height;
          // Calculate grid cell range (precise)
          const gridMinX = Math.floor(left / this.cellSize);
          const gridMinY = Math.floor(top / this.cellSize);
          const gridMaxX = Math.ceil(right / this.cellSize) - 1;
          const gridMaxY = Math.ceil(bottom / this.cellSize) - 1;

          // Collect blocked cells for summary
          const blockedCells: Array<{ x: number, y: number }> = [];

          // For each cell in this range, check AABB overlap
          for (let y = gridMinY; y <= gridMaxY; y++) {
            for (let x = gridMinX; x <= gridMaxX; x++) {
              if (this.grid.inBounds(x, y)) {
                const cellLeft = x * this.cellSize;
                const cellTop = y * this.cellSize;
                const cellRight = cellLeft + this.cellSize;
                const cellBottom = cellTop + this.cellSize;
                // Robust AABB overlap check
                if (
                  cellLeft < right &&
                  cellRight > left &&
                  cellTop < bottom &&
                  cellBottom > top
                ) {
                  this.grid.setWalkable(x, y, false);
                  blockedCells.push({ x, y });
                }
              }
            }
          }

        }
      }
    });
  }

  /**
   * Set world dimensions and update grid accordingly
   * (Call before adding entities if you need a custom size)
   */
  setWorldDimensions(width: number, height: number, cellSize: number = 32): void {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.grid = new Grid(
      Math.ceil(width / cellSize),
      Math.ceil(height / cellSize),
      cellSize
    );
    this.updateGridFromObstacles();
  }
} 