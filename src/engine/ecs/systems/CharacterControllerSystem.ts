import { System } from '@engine/ecs/System';
import { Entity } from '@engine/ecs/Entity';
import { Transform } from '@engine/ecs/components/Transform';
import { CharacterController } from '@engine/ecs/components/CharacterController';
import { Vector2 } from '@engine/math/Vector2';

// Define an interface for dimensions
interface Dimensions {
  width: number;
  height: number;
}

/**
 * System that handles character movement and physics based on CharacterController state.
 * Reads moveDirection and aimDirection and applies physics to the Transform.
 */
export class CharacterControllerSystem extends System {
  private controlledEntities: Map<Entity, {
    transform: Transform;
    controller: CharacterController;
    velocity: Vector2;
    currentRotationDegrees: number;
  }>;
  // Store dimensions locally
  private dimensions: Dimensions;
  private rotationSmoothingFactor: number = 0.15; // Adjust for desired smoothness (0=instant, 1=very slow)

  constructor(dimensions: Dimensions, rotationSmoothing: number = 0.15) {
    // Process entities with transform and character-controller
    super(['transform', 'character-controller']);
    this.controlledEntities = new Map();
    // Store the provided dimensions
    this.dimensions = dimensions;
    this.rotationSmoothingFactor = rotationSmoothing;
  }

  /**
   * Add an entity to be processed by this system
   */
  addEntity(entity: Entity): void {
    // Check using the updated component requirements
    if (!this.shouldProcessEntity(entity)) {
      // Optionally log if an entity that shouldn't be processed is passed
      // console.warn(`CharacterControllerSystem: Entity ${entity.getId()} does not meet requirements.`);
      return;
    }
    super.addEntity(entity); // Add to internal Set<Entity> first

    // If entity was added successfully by the parent class, add to our map
    if (this.entities.has(entity)) {
      const transform = entity.getComponent('transform') as Transform;
      const controller = entity.getComponent('character-controller') as CharacterController;

      // Initialize velocity from controller or default to zero
      const initialVelocity = controller.getVelocity ? controller.getVelocity() : { x: 0, y: 0 };
      // Initialize rotation based on initial transform or default to 0
      const initialRotation = transform.getRotation ? transform.getRotation() : 0;

      this.controlledEntities.set(entity, {
        transform,
        controller,
        velocity: { ...initialVelocity }, // Store initial velocity
        currentRotationDegrees: initialRotation // Initialize rotation
      });
    } else {
      // This case should ideally not happen if shouldProcessEntity is checked first
      console.error(`CharacterControllerSystem: CRITICAL - Entity ${entity.getId()} passed shouldProcessEntity but was not added by System class.`);
    }
  }

  /**
   * Remove an entity from this system
   */
  removeEntity(entity: Entity): void {
    super.removeEntity(entity);
    this.controlledEntities.delete(entity);
  }

  /**
   * Fixed update for physics simulation
   */
  fixedUpdate(deltaTime: number): void {
    // Keep deltaTime conversion and capping
    if (deltaTime > 1) {
      deltaTime = deltaTime / 1000;
    }
    const safeDeltatime = Math.min(deltaTime, 0.1);

    // Log if no entities exist (changed map name)
    if (this.controlledEntities.size === 0) {
      // This might be normal if no enemies or player are present
      // console.warn('CharacterControllerSystem: No entities to process');
      return;
    }

    // Keep boundary logic if needed for general collision/bounds checks
    const canvasWidth = this.dimensions.width;
    const canvasHeight = this.dimensions.height;

    // Process each controlled entity (changed map name)
    this.controlledEntities.forEach((data, entity) => {
      // ... Keep the core movement logic from the original fixedUpdate ...
      // Get components
      const { transform, controller } = data;

      let currentVelocity = data.velocity; // Use velocity stored in the system map

      // Get config and desired move direction from the component
      const config = controller.getConfig();
      const moveDirection = controller.getMoveDirection();

      // Access config properties correctly
      const maxSpeed = config.maxSpeed;
      const acceleration = config.acceleration;
      const deceleration = config.deceleration;

      let targetVelocityX = moveDirection.x * maxSpeed;
      let targetVelocityY = moveDirection.y * maxSpeed;

      // Apply acceleration/deceleration
      let newVelocityX;
      let newVelocityY;

      if (moveDirection.x !== 0 || moveDirection.y !== 0) {
        // Accelerate towards target velocity
        newVelocityX = this.accelerate(currentVelocity.x, targetVelocityX, acceleration, safeDeltatime);
        newVelocityY = this.accelerate(currentVelocity.y, targetVelocityY, acceleration, safeDeltatime);
      } else {
        // Decelerate towards zero
        newVelocityX = this.decelerate(currentVelocity.x, deceleration, safeDeltatime);
        newVelocityY = this.decelerate(currentVelocity.y, deceleration, safeDeltatime);
      }

      // Clamp velocity to max speed
      const currentSpeed = Math.sqrt(newVelocityX * newVelocityX + newVelocityY * newVelocityY);
      if (currentSpeed > maxSpeed) {
        const factor = maxSpeed / currentSpeed;
        newVelocityX *= factor;
        newVelocityY *= factor;
      }

      // Update the velocity stored in the system map
      data.velocity = { x: newVelocityX, y: newVelocityY };

      // Update position based on new velocity
      const currentPosition = transform.getPosition();
      const newPositionX = currentPosition.x + newVelocityX * safeDeltatime;
      const newPositionY = currentPosition.y + newVelocityY * safeDeltatime;

      // Boundary checks removed - handled by CollisionSystem
      // const clampedX = Math.max(0, Math.min(canvasWidth, newPositionX));
      // const clampedY = Math.max(0, Math.min(canvasHeight, newPositionY));

      // Update transform position directly with calculated new position
      transform.setPosition({ x: newPositionX, y: newPositionY });

      // Handle rotation based on aim direction (if needed generically)
      const aimDirection = controller.getAimDirection();
      if (aimDirection.x !== 0 || aimDirection.y !== 0) {
        // Calculate the target angle based on the aim direction
        const targetAngleDegrees = Math.atan2(aimDirection.y, aimDirection.x) * (180 / Math.PI);

        // Get the current visual rotation
        let currentRotation = data.currentRotationDegrees;

        // Calculate the shortest difference between current and target angle
        let angleDiff = targetAngleDegrees - currentRotation;
        while (angleDiff > 180) angleDiff -= 360;
        while (angleDiff <= -180) angleDiff += 360;

        // Apply smoothing - move towards target angle by a fraction
        // Use 1 - factor for lerp-like behavior: closer = smaller step
        const rotationStep = angleDiff * (1 - Math.pow(1 - this.rotationSmoothingFactor, safeDeltatime * 60)); // 60 FPS assumption for smoothing feel
        // Alternative simpler lerp:
        // const rotationStep = angleDiff * this.rotationSmoothingFactor;

        currentRotation += rotationStep;

        // Normalize again after adding step
        while (currentRotation > 180) currentRotation -= 360;
        while (currentRotation <= -180) currentRotation += 360;

        // Update the stored current rotation
        data.currentRotationDegrees = currentRotation;

        // Apply the smoothed rotation to the transform
        transform.setRotation(currentRotation);
      } else {
        // else: no aim direction, maintain current rotation
      }
    });
  }

  // Keep accelerate/decelerate helper methods
  private accelerate(current: number, target: number, accel: number, dt: number): number {
    if (current < target) {
      return Math.min(current + accel * dt, target);
    } else if (current > target) {
      return Math.max(current - accel * dt, target);
    }
    return current;
  }

  private decelerate(current: number, decel: number, dt: number): number {
    if (current > 0) {
      return Math.max(0, current - decel * dt);
    } else if (current < 0) {
      return Math.min(0, current + decel * dt);
    }
    return 0;
  }

  // Add empty update method to satisfy System base class
  update(): void {
    // This system primarily uses fixedUpdate for physics.
    // Regular update could be used for non-physics related logic if needed.
  }

  // Remove dispose logic related to input manager
  dispose(): void {
    this.controlledEntities.clear();
    // Remove super.dispose() as it doesn't seem to exist on the base System
    // super.dispose(); // Call parent dispose
  }
} 