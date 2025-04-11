import { System } from '@engine/ecs/System';
import { Entity } from '@engine/ecs/Entity';
import { Transform } from '@engine/ecs/components/Transform';
import { CharacterController } from '@engine/ecs/components/CharacterController';
import { InputManager } from '@engine/input/InputManager';
import { InputAction, InputAxis, IInputEventSubscriber } from '@engine/input/types';

/**
 * System that handles character movement and physics
 */
export class CharacterControllerSystem extends System implements IInputEventSubscriber {
  private inputManager: InputManager;
  private characters: Map<Entity, { transform: Transform; controller: CharacterController }>;

  constructor(inputManager: InputManager) {
    super(['transform', 'character-controller']);
    this.inputManager = inputManager;
    this.characters = new Map();

    // Subscribe to input events
    this.inputManager.subscribe(this);
  }

  /**
   * Add an entity to be processed by this system
   */
  addEntity(entity: Entity): boolean {
    const transform = entity.getComponent<Transform>('transform');
    const controller = entity.getComponent<CharacterController>('character-controller');

    if (transform && controller) {
      this.characters.set(entity, { transform, controller });
      return true;
    }
    return false;
  }

  /**
   * Remove an entity from this system
   */
  removeEntity(entity: Entity): void {
    this.characters.delete(entity);
  }

  /**
   * Handle input axis changes (movement and aim)
   */
  onInputAxisChange(action: InputAction, value: InputAxis): void {
    this.characters.forEach(({ controller }) => {
      switch (action) {
        case InputAction.Move:
          controller.setMoveDirection(value.normalized);
          break;
        case InputAction.Aim:
          controller.setAimDirection(value.normalized);
          break;
      }
    });
  }

  /**
   * Fixed update for physics simulation
   */
  fixedUpdate(deltaTime: number): void {
    this.characters.forEach(({ transform, controller }) => {
      // Update physics state
      controller.updatePhysics(deltaTime);

      // Apply velocity to position
      const velocity = controller.getVelocity();
      transform.translate({
        x: velocity.x * deltaTime,
        y: velocity.y * deltaTime
      });

      // Update rotation to face aim direction
      const aimDir = controller.getAimDirection();
      const targetRotation = Math.atan2(aimDir.y, aimDir.x);
      const currentRotation = transform.getRotation();

      // Smoothly interpolate rotation
      const rotationDiff = targetRotation - currentRotation;
      const shortestRotation = Math.atan2(Math.sin(rotationDiff), Math.cos(rotationDiff));
      const rotationSpeed = 5; // Default rotation speed if config is not accessible
      transform.rotate(shortestRotation * rotationSpeed * deltaTime);
    });
  }

  /**
   * Regular update for non-physics updates
   */
  update(): void {
    // No non-physics updates needed
  }

  /**
   * Clean up when system is destroyed
   */
  dispose(): void {
    this.inputManager.unsubscribe(this);
    this.characters.clear();
  }
} 