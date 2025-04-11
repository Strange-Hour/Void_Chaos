import { Canvas } from './Canvas';
import { Entity } from './ecs/Entity';
import { System } from './ecs/System';

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
 */
export class Game {
  private canvas: Canvas;
  private entities: Map<number, Entity>;
  private systems: System[];
  private fixedTimeStep: number;
  private accumulator: number;
  private lastFixedUpdateTime: number;

  constructor(config: GameConfig) {
    this.canvas = new Canvas(config);
    this.entities = new Map();
    this.systems = [];
    this.fixedTimeStep = config.fixedTimeStep || 1000 / 60; // Default to 60 FPS for physics
    this.accumulator = 0;
    this.lastFixedUpdateTime = performance.now();

    // Bind the update method to be used as a render callback
    this.update = this.update.bind(this);
    this.canvas.addRenderCallback(this.update);
  }

  /**
   * Add an entity to the game
   */
  addEntity(entity: Entity): void {
    this.entities.set(entity.getId(), entity);
    // Add entity to all relevant systems
    this.systems.forEach(system => system.addEntity(entity));
  }

  /**
   * Remove an entity from the game
   */
  removeEntity(entity: Entity): void {
    this.entities.delete(entity.getId());
    // Remove entity from all systems
    this.systems.forEach(system => system.removeEntity(entity));
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
} 