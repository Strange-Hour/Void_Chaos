import { Canvas } from './Canvas';
import { Entity } from './ecs/Entity';
import { System } from './ecs/System';
import { CollisionSystem } from './ecs/systems/CollisionSystem';
import { World } from './ecs/World';

// Re-export from Canvas.ts
export interface CanvasConfig {
  width: number;
  height: number;
  containerId?: string;
  pixelRatio?: number;
  backgroundColor?: string;
  camera?: {
    x?: number;
    y?: number;
    zoom?: number;
  };
  targetFPS?: number;
}

export interface GameConfig extends CanvasConfig {
  fixedTimeStep?: number;
}

/**
 * Main game class that manages the ECS and game loop
 * 
 * Core systems:
 * - Canvas rendering for visual output
 * - Entity Component System (ECS) for game object management
 * - Physics/collision detection via CollisionSystem
 * - Input handling and player control
 * - Game loop with fixed and variable timesteps
 */
export class Game {
  // Static property to track the last force redraw time
  private static _lastForceRedrawTime: number = 0;

  private canvas: Canvas;
  private entities: Map<number, Entity>;
  private systems: System[];
  private fixedTimeStep: number;
  private accumulator: number;
  private lastFixedUpdateTime: number;
  private world: World;
  private collisionSystem: CollisionSystem | null = null;

  constructor(config: GameConfig) {
    this.canvas = new Canvas(config);
    this.entities = new Map();
    this.systems = [];
    this.fixedTimeStep = config.fixedTimeStep || 1000 / 60; // Default to 60 FPS for physics
    this.accumulator = 0;
    this.lastFixedUpdateTime = performance.now();
    this.world = new World();

    // Bind the update method to be used as a render callback
    this.update = this.update.bind(this);
    this.canvas.addRenderCallback(this.update);
  }

  /**
   * Get the canvas instance
   */
  getCanvas(): Canvas {
    return this.canvas;
  }

  /**
   * Get the world instance
   */
  getWorld(): World {
    return this.world;
  }

  /**
   * Initialize and add a collision system to the game
   * @returns The created collision system
   */
  initializeCollisionSystem(): CollisionSystem {
    if (this.collisionSystem) {
      console.log('Collision system already initialized, returning existing instance');
      return this.collisionSystem;
    }

    console.log('Initializing collision system...');

    // Create a new collision system
    this.collisionSystem = new CollisionSystem(this.world);

    // Add it to the game systems
    this.addSystem(this.collisionSystem);

    // Set up default layer collisions if needed
    // Enable all layers to collide by default (layers 0-10)
    for (let i = 0; i < 10; i++) {
      for (let j = i; j < 10; j++) {
        this.collisionSystem.setLayerCollision(i, j, true);
      }
    }

    console.log('Collision system initialized and added to game systems');
    console.log(`Total entities in world: ${this.world.getEntities().length}`);
    console.log(`Total systems in game: ${this.systems.length}`);

    return this.collisionSystem;
  }

  /**
   * Get the collision system if it exists
   */
  getCollisionSystem(): CollisionSystem | null {
    return this.collisionSystem;
  }

  /**
   * Add an entity to the game
   */
  addEntity(entity: Entity): void {
    this.entities.set(entity.getId(), entity);
    // Add entity to world
    this.world.addEntity(entity);
    // Add entity to all systems
    this.systems.forEach(system => {
      system.addEntity(entity);
    });
  }

  /**
   * Remove an entity from the game
   */
  removeEntity(entity: Entity): void {
    this.entities.delete(entity.getId());
    // Remove entity from world
    this.world.removeEntity(entity);
    // Remove entity from all systems
    this.systems.forEach(system => {
      system.removeEntity(entity);
    });
  }

  /**
   * Get an entity by ID
   */
  getEntity(id: number): Entity | undefined {
    return this.entities.get(id);
  }

  /**
   * Add a system to the game
   */
  addSystem(system: System): void {
    this.systems.push(system);
    // Add all existing entities to the system
    Array.from(this.entities.values()).forEach(entity => {
      system.addEntity(entity);
    });
  }

  /**
   * Remove a system from the game
   */
  removeSystem(system: System): void {
    const index = this.systems.indexOf(system);
    if (index !== -1) {
      this.systems.splice(index, 1);
    }
  }

  /**
   * Start the game loop
   */
  start(): void {
    this.lastFixedUpdateTime = performance.now();
    this.accumulator = 0;
    this.canvas.start();
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.canvas.stop();
  }

  /**
   * Clean up game resources
   */
  destroy(): void {
    this.stop();
    this.canvas.destroy();
    this.entities.clear();
    this.systems.length = 0;
  }

  /**
   * Main update loop
   * Handles both fixed timestep updates for physics/logic and variable timestep for rendering
   */
  private update(deltaTime: number): void {
    const currentTime = performance.now();
    const fixedDeltaTime = currentTime - this.lastFixedUpdateTime;
    this.lastFixedUpdateTime = currentTime;

    // Add unprocessed time to the accumulator
    this.accumulator += fixedDeltaTime;

    // Update systems with fixed timestep
    while (this.accumulator >= this.fixedTimeStep) {
      this.fixedUpdate(this.fixedTimeStep / 1000); // Convert to seconds
      this.accumulator -= this.fixedTimeStep;
    }

    // Calculate alpha for interpolation (0 to 1)
    const alpha = this.accumulator / this.fixedTimeStep;

    // Update systems that need variable timestep (like rendering)
    this.variableUpdate(deltaTime / 1000, alpha);
  }

  /**
   * Fixed timestep update for physics and game logic
   * CollisionSystem is typically updated during this phase
   */
  private fixedUpdate(deltaTime: number): void {
    // Update all systems that require fixed timestep
    this.systems.forEach(system => {
      if (this.isFixedUpdateSystem(system)) {
        system.fixedUpdate(deltaTime);
      } else {
        system.update(deltaTime);
      }
    });
  }

  /**
   * Variable timestep update for rendering and interpolation
   */
  private variableUpdate(deltaTime: number, alpha: number): void {
    // Update all systems that require variable timestep
    this.systems.forEach(system => {
      if (this.isInterpolatedSystem(system)) {
        system.interpolatedUpdate(deltaTime, alpha);
      }
    });
  }

  /**
   * Type guard for systems that support fixed timestep updates
   */
  private isFixedUpdateSystem(system: System): system is System & { fixedUpdate: (deltaTime: number) => void } {
    return 'fixedUpdate' in system;
  }

  /**
   * Type guard for systems that support interpolated updates
   */
  private isInterpolatedSystem(system: System): system is System & { interpolatedUpdate: (deltaTime: number, alpha: number) => void } {
    return 'interpolatedUpdate' in system;
  }

  /**
   * Force an immediate redraw of the game
   * This is useful for ensuring visual systems like debug overlays are updated
   */
  public forceRedraw(): void {
    // Use static timestamp to prevent excessive redraws
    const currentTime = Date.now();
    const lastRedrawTime = Game._lastForceRedrawTime;

    // Prevent more than 10 redraws per second
    if (currentTime - lastRedrawTime < 100) {
      return;
    }

    // Update timestamp
    Game._lastForceRedrawTime = currentTime;

    // Force all systems to update immediately
    this.systems.forEach(system => {
      if (this.isInterpolatedSystem(system)) {
        system.interpolatedUpdate(0.016, 1.0); // Standard 60fps timestep
      } else {
        system.update(0.016);
      }
    });

    // Also force the canvas to redraw
    this.canvas.forceRedraw();
  }
} 