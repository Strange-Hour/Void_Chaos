import { System } from '../System';
import { World } from '../World';

/**
 * System that wraps World updates to integrate with the Game's update system
 */
export class WorldSystem extends System {
  private world: World;

  constructor(world: World) {
    super([]);
    this.world = world;
    // Only log initialization
    console.log('WorldSystem initialized');
  }

  /**
   * Regular update for non-physics updates
   */
  update(deltaTime: number): void {
    // Convert deltaTime from ms to seconds for world update
    const dt = deltaTime / 1000;

    // Update world which will update all systems
    this.world.update(dt);
  }

  /**
   * Fixed update for physics simulation
   * This is called by the Game class at a fixed timestep
   */
  fixedUpdate(deltaTime: number): void {
    // Update world with fixed timestep
    this.world.fixedUpdate(deltaTime);
  }

  /**
   * Interpolated update integrates regular world updates into the Game's variable-timestep loop
   */
  interpolatedUpdate(deltaTime: number, _alpha: number): void {
    // Reference alpha to avoid unused variable lint errors
    void _alpha;

    // Always process entity changes to pick up any new entities
    this.world.processEntityChanges();

    // deltaTime is in seconds here, convert to ms for world update for standard systems
    this.world.update(deltaTime * 1000);

    // Force an additional update of systems that need continuous visual updates regardless of physics
    this.world.getSystems().forEach(system => {
      // Only update render and debug systems in this loop
      if (system.constructor.name === 'DebugSystem' || system.constructor.name === 'RenderSystem') {
        system.update(deltaTime * 1000);
      }
    });
  }
} 