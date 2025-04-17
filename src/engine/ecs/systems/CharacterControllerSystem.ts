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
  private lastMoveInput: InputAxis | null = null;

  constructor(inputManager: InputManager) {
    // Only handle player entities (transform + controller + player)
    super(['transform', 'character-controller', 'player']);
    this.inputManager = inputManager;
    this.characters = new Map();

    // Subscribe to input events
    this.inputManager.subscribe(this);
  }

  /**
   * Add an entity to be processed by this system
   */
  addEntity(entity: Entity): void {
    super.addEntity(entity);

    // If entity was added successfully, add to characters map
    if (this.entities.has(entity)) {
      const transform = entity.getComponent('transform') as Transform;
      const controller = entity.getComponent('character-controller') as CharacterController;

      this.characters.set(entity, { transform, controller });
    } else {
      console.warn('CRITICAL - Entity not added to CharacterControllerSystem:', {
        entityId: entity.getId(),
        requiredComponents: Array.from(this.getRequiredComponents()),
        entityHasComponents: entity.getComponents ? Object.keys(entity.getComponents()) : [],
        metRequirements: this.shouldProcessEntity(entity)
      });
    }
  }

  /**
   * Remove an entity from this system
   */
  removeEntity(entity: Entity): void {
    super.removeEntity(entity);
    this.characters.delete(entity);
  }

  /**
   * Handle input axis changes (movement and aim)
   */
  onInputAxisChange(action: InputAction, value: InputAxis): void {
    console.log('CharacterControllerSystem.onInputAxisChange called:', {
      action,
      value,
      entityCount: this.characters.size
    });

    // Store move input for use in fixed update
    if (action === InputAction.Move) {
      this.lastMoveInput = value;
      console.log('Move input stored for later use:', this.lastMoveInput);
    }

    this.characters.forEach(({ controller }) => {
      switch (action) {
        case InputAction.Move:
          console.log('Setting move direction on controller:', {
            direction: value.normalized,
            controller: controller.constructor.name
          });
          controller.setMoveDirection(value.normalized);
          break;
        case InputAction.Aim:
          controller.setAimDirection(value.normalized);
          break;
      }
    });

    // After player movement input, trigger a redraw to update debug visuals
    if (action === InputAction.Move || action === InputAction.Aim) {
      if (typeof window !== 'undefined') {
        // Access the game instance if available
        const customWindow = window as unknown as {
          game?: { forceRedraw: () => void },
          _lastInputRedrawTime?: number
        };

        if (customWindow.game) {
          // Throttle redraws to prevent excessive updates
          const currentTime = Date.now();
          const lastRedrawTime = customWindow._lastInputRedrawTime || 0;

          // Only trigger redraw if enough time has passed (max 5 per second)
          if (currentTime - lastRedrawTime > 200) {
            // Set a short timeout to allow transform to update first
            setTimeout(() => {
              console.log('Triggering force redraw due to player movement');
              customWindow.game!.forceRedraw();
              customWindow._lastInputRedrawTime = Date.now();
            }, 10);
          }
        }
      }
    }
  }

  /**
   * Fixed update for physics simulation
   */
  fixedUpdate(deltaTime: number): void {
    // Check if deltaTime is in milliseconds and convert if needed
    if (deltaTime > 1) {
      deltaTime = deltaTime / 1000;
    }

    // Cap deltaTime to prevent physics explosion (max 100ms or 0.1s)
    const safeDeltatime = Math.min(deltaTime, 0.1);

    // Reapply last move input to ensure movement continues
    if (this.lastMoveInput && this.lastMoveInput.magnitude > 0) {
      this.characters.forEach(({ controller }) => {
        controller.setMoveDirection(this.lastMoveInput!.normalized);
      });
    }

    // Log if no characters exist
    if (this.characters.size === 0) {
      console.error('CRITICAL - No characters registered with CharacterControllerSystem');
      return;
    }

    // Define canvas boundaries (standard size)
    const canvasWidth = 800;
    const canvasHeight = 600;

    // Process each character
    this.characters.forEach(({ transform, controller }) => {
      // Update physics state
      controller.updatePhysics(safeDeltatime);

      // Apply velocity to position
      const velocity = controller.getVelocity();
      const movement = {
        x: velocity.x * safeDeltatime,
        y: velocity.y * safeDeltatime
      };

      transform.translate(movement);

      // Get new position after movement
      const newPosition = transform.getPosition();

      // Apply screen boundaries to keep entity visible
      const boundedPosition = controller.applyScreenBoundaries(newPosition, canvasWidth, canvasHeight);

      // Only update position if boundaries were applied
      if (boundedPosition.x !== newPosition.x || boundedPosition.y !== newPosition.y) {
        transform.setPosition(boundedPosition);
      }

      // POSITION BOUNDARY CHECK (new)
      // Prevent character from going too far from the origin (10000 pixels max)
      const MAX_DISTANCE = 10000;
      const distanceFromOrigin = Math.sqrt(
        newPosition.x * newPosition.x + newPosition.y * newPosition.y
      );

      if (distanceFromOrigin > MAX_DISTANCE) {
        // Reset to original position or center if needed
        if (distanceFromOrigin > MAX_DISTANCE * 2) {
          // If extremely far, reset to center
          transform.setPosition({ x: 400, y: 300 });
        } else {
          // Otherwise scale back toward origin to stay within bounds
          const scaleFactor = MAX_DISTANCE / distanceFromOrigin;
          transform.setPosition({
            x: newPosition.x * scaleFactor,
            y: newPosition.y * scaleFactor
          });
        }

        // Reset velocity to prevent continued excessive movement
        controller.setMoveDirection({ x: 0, y: 0 });
      }

      // Update rotation to face aim direction
      const aimDir = controller.getAimDirection();
      const targetRotation = Math.atan2(aimDir.y, aimDir.x);
      const currentRotation = transform.getRotation();

      // Smoothly interpolate rotation
      const rotationDiff = targetRotation - currentRotation;
      const shortestRotation = Math.atan2(Math.sin(rotationDiff), Math.cos(rotationDiff));
      const rotationSpeed = 5; // Default rotation speed if config is not accessible
      transform.rotate(shortestRotation * rotationSpeed * safeDeltatime);
    });
  }

  /**
   * Regular update for non-physics updates
   */
  update(): void {
    // placeholder
  }

  /**
   * Clean up when system is destroyed
   */
  dispose(): void {
    this.inputManager.unsubscribe(this);
    this.characters.clear();
  }
} 