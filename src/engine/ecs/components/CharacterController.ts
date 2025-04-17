import { Component } from '@engine/ecs/Entity';
import { Vector2 } from '@engine/math/Vector2';

export interface CharacterControllerConfig {
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  rotationSpeed: number;
  mass: number;
  friction: number;
}

const DEFAULT_CONFIG: CharacterControllerConfig = {
  maxSpeed: 300, // pixels per second
  acceleration: 1000, // pixels per second squared
  deceleration: 800, // pixels per second squared
  rotationSpeed: 5, // radians per second
  mass: 1,
  friction: 0.1
};

/**
 * Component that handles character physics and movement
 */
export class CharacterController extends Component {
  private config: CharacterControllerConfig;
  private velocity: Vector2;
  private moveDirection: Vector2;
  private aimDirection: Vector2;
  private isMoving: boolean;

  constructor(config: Partial<CharacterControllerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.velocity = { x: 0, y: 0 };
    this.moveDirection = { x: 0, y: 0 };
    this.aimDirection = { x: 1, y: 0 };
    this.isMoving = false;
  }

  getType(): string {
    return 'character-controller';
  }

  /**
   * Set the movement direction from input
   */
  setMoveDirection(direction: Vector2): void {
    this.moveDirection = { ...direction };
    this.isMoving = Math.abs(direction.x) > 0.01 || Math.abs(direction.y) > 0.01;
  }

  /**
   * Set the aim direction from input
   */
  setAimDirection(direction: Vector2): void {
    this.aimDirection = { ...direction };
  }

  /**
   * Get the current velocity
   */
  getVelocity(): Vector2 {
    return { ...this.velocity };
  }

  /**
   * Get the aim direction
   */
  getAimDirection(): Vector2 {
    return { ...this.aimDirection };
  }

  /**
   * Get the move direction
   */
  getMoveDirection(): Vector2 {
    return { ...this.moveDirection };
  }

  /**
   * Update the physics state
   */
  updatePhysics(deltaTime: number): void {
    // IMPORTANT: Ensure deltaTime is seconds not milliseconds
    // If deltaTime is too large (>1), it's likely in milliseconds - convert it
    if (deltaTime > 1) {
      deltaTime = deltaTime / 1000;
    }

    // Cap deltaTime to prevent unstable physics
    const safeDeltatime = Math.min(deltaTime, 0.1);

    // Apply acceleration in move direction
    if (this.isMoving) {
      const acceleration = this.config.acceleration * safeDeltatime;
      this.velocity.x += this.moveDirection.x * acceleration;
      this.velocity.y += this.moveDirection.y * acceleration;
    }

    // Apply deceleration when not moving or over max speed
    const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    if (!this.isMoving || speed > this.config.maxSpeed) {
      const deceleration = this.config.deceleration * safeDeltatime;
      const friction = Math.min(speed, deceleration);
      if (speed > 0) {
        this.velocity.x -= (this.velocity.x / speed) * friction;
        this.velocity.y -= (this.velocity.y / speed) * friction;
      }
    }

    // ABSOLUTE velocity clamping (new)
    // This ensures velocity never exceeds maxSpeed in ANY case
    const currentSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    const maxSpeedWithBuffer = this.config.maxSpeed * 1.5; // Allow slightly higher for brief moments

    if (currentSpeed > maxSpeedWithBuffer) {
      // Hard clamp velocity
      const scaleFactor = maxSpeedWithBuffer / currentSpeed;
      this.velocity.x *= scaleFactor;
      this.velocity.y *= scaleFactor;
    }

    // Apply friction
    this.velocity.x *= (1 - this.config.friction);
    this.velocity.y *= (1 - this.config.friction);

    // Stop completely if moving very slowly
    if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
    if (Math.abs(this.velocity.y) < 0.01) this.velocity.y = 0;

    // SANITY CHECK: If velocity somehow becomes NaN or infinite, reset it
    if (isNaN(this.velocity.x) || !isFinite(this.velocity.x) ||
      isNaN(this.velocity.y) || !isFinite(this.velocity.y)) {
      console.error('Invalid velocity detected - resetting to zero');
      this.velocity.x = 0;
      this.velocity.y = 0;
    }
  }

  serialize(): object {
    return {
      config: { ...this.config },
      velocity: { ...this.velocity },
      moveDirection: { ...this.moveDirection },
      aimDirection: { ...this.aimDirection },
      isMoving: this.isMoving
    };
  }

  deserialize(data: {
    config: CharacterControllerConfig;
    velocity: Vector2;
    moveDirection: Vector2;
    aimDirection: Vector2;
    isMoving: boolean;
  }): void {
    this.config = { ...data.config };
    this.velocity = { ...data.velocity };
    this.moveDirection = { ...data.moveDirection };
    this.aimDirection = { ...data.aimDirection };
    this.isMoving = data.isMoving;
  }

  /**
   * Applies screen boundary constraints to keep entity within visible area
   */
  applyScreenBoundaries(position: Vector2, canvasWidth: number, canvasHeight: number): Vector2 {
    // Add padding to keep entities visible
    const padding = 20;

    // Constrain x and y coordinates
    const boundedX = Math.max(padding, Math.min(canvasWidth - padding, position.x));
    const boundedY = Math.max(padding, Math.min(canvasHeight - padding, position.y));

    return { x: boundedX, y: boundedY };
  }
} 