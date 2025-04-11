import { Entity } from './Entity';

/**
 * Base class for all systems in the ECS architecture.
 * Systems process entities that have specific component combinations.
 */
export abstract class System {
  protected entities: Set<Entity>;
  private requiredComponents: Set<string>;

  constructor(requiredComponents: string[]) {
    this.entities = new Set();
    this.requiredComponents = new Set(requiredComponents);
  }

  /**
   * Check if an entity should be processed by this system
   */
  shouldProcessEntity(entity: Entity): boolean {
    return Array.from(this.requiredComponents).every(type => entity.hasComponent(type));
  }

  /**
   * Add an entity to be processed by this system
   */
  addEntity(entity: Entity): void {
    if (this.shouldProcessEntity(entity)) {
      this.entities.add(entity);
    }
  }

  /**
   * Remove an entity from this system
   */
  removeEntity(entity: Entity): void {
    this.entities.delete(entity);
  }

  /**
   * Get all entities being processed by this system
   */
  getEntities(): Entity[] {
    return Array.from(this.entities);
  }

  /**
   * Get the component types required by this system
   */
  getRequiredComponents(): string[] {
    return Array.from(this.requiredComponents);
  }

  /**
   * Update this system
   * @param deltaTime Time elapsed since last update in milliseconds
   */
  abstract update(deltaTime: number): void;

  /**
   * Fixed update method for physics and game logic
   * Override this in systems that need fixed timestep updates
   * @param deltaTime Fixed time step in seconds
   */
  fixedUpdate?(deltaTime: number): void;

  /**
   * Interpolated update method for rendering
   * Override this in systems that need to interpolate between physics states
   * @param deltaTime Time elapsed since last update in seconds
   * @param alpha Interpolation factor between 0 and 1
   */
  interpolatedUpdate?(deltaTime: number, alpha: number): void;
}

/**
 * Interface for systems that need to handle initialization
 */
export interface Initializable {
  initialize(): void;
}

/**
 * Interface for systems that need cleanup
 */
export interface Disposable {
  dispose(): void;
} 