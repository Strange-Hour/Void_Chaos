import { Entity } from './Entity';

/**
 * Base class for all systems in the ECS architecture.
 * Systems process entities that have specific component combinations.
 */
export abstract class System {
  private entities: Set<Entity>;
  private requiredComponents: Set<string>;

  constructor(requiredComponents: string[]) {
    this.entities = new Set();
    this.requiredComponents = new Set(requiredComponents);
  }

  /**
   * Check if an entity has all required components for this system
   */
  private hasRequiredComponents(entity: Entity): boolean {
    return Array.from(this.requiredComponents).every(componentType =>
      entity.hasComponent(componentType)
    );
  }

  /**
   * Add an entity to this system if it has all required components
   */
  addEntity(entity: Entity): boolean {
    if (this.hasRequiredComponents(entity)) {
      this.entities.add(entity);
      return true;
    }
    return false;
  }

  /**
   * Remove an entity from this system
   */
  removeEntity(entity: Entity): void {
    this.entities.delete(entity);
  }

  /**
   * Get all entities currently managed by this system
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
   * Update method to be implemented by specific system implementations
   * This is called for systems that don't implement fixedUpdate
   * @param deltaTime Time elapsed since last update in seconds
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