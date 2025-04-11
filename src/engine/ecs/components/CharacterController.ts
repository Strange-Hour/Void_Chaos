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
    this.isMoving = direction.x !== 0 || direction.y !== 0;
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
   * Update the physics state
   */
  updatePhysics(deltaTime: number): void {
    // Apply acceleration in move direction
    if (this.isMoving) {
      const acceleration = this.config.acceleration * deltaTime;
      this.velocity.x += this.moveDirection.x * acceleration;
      this.velocity.y += this.moveDirection.y * acceleration;
    }

    // Apply deceleration when not moving or over max speed
    const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    if (!this.isMoving || speed > this.config.maxSpeed) {
      const deceleration = this.config.deceleration * deltaTime;
      const friction = Math.min(speed, deceleration);
      if (speed > 0) {
        this.velocity.x -= (this.velocity.x / speed) * friction;
        this.velocity.y -= (this.velocity.y / speed) * friction;
      }
    }

    // Clamp to max speed
    if (speed > this.config.maxSpeed) {
      const scale = this.config.maxSpeed / speed;
      this.velocity.x *= scale;
      this.velocity.y *= scale;
    }

    // Apply friction
    this.velocity.x *= (1 - this.config.friction);
    this.velocity.y *= (1 - this.config.friction);

    // Stop completely if moving very slowly
    if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
    if (Math.abs(this.velocity.y) < 0.01) this.velocity.y = 0;
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
} 