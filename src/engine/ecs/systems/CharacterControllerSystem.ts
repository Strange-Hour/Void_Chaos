import { System } from '@engine/ecs/System';
import { Entity } from '@engine/ecs/Entity';
import { Transform } from '@engine/ecs/components/Transform';
import { CharacterController } from '@engine/ecs/components/CharacterController';
import { InputManager } from '@engine/input/InputManager';
import { InputAction, InputAxis, IInputEventSubscriber } from '@engine/input/types';
import { Vector2 } from '@engine/math/Vector2';

/**
 * System that handles character movement and physics
 */
export class CharacterControllerSystem extends System implements IInputEventSubscriber {
  private inputManager: InputManager;
  private characters: Map<Entity, {
    transform: Transform;
    controller: CharacterController;
    lastFacingDirection: Vector2;
    inputHistory: Vector2[];
    currentRotationDegrees: number; // Track current rotation in degrees
  }>;
  private lastMoveInput: InputAxis | null = null;
  private inputSmoothingFactor: number = 0.3;
  private maxInputHistoryLength: number = 5;
  private rotationSmoothingFactor: number = 0.9; // Lower = slower rotation

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

      this.characters.set(entity, {
        transform,
        controller,
        lastFacingDirection: { x: 1, y: 0 }, // Default facing right
        inputHistory: [], // Initialize input history
        currentRotationDegrees: 0 // Initialize at 0 degrees (facing right)
      });
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

    this.characters.forEach((data) => {
      const { controller, lastFacingDirection, inputHistory } = data;
      switch (action) {
        case InputAction.Move:
          console.log('Setting move direction on controller:', {
            direction: value.normalized,
            controller: controller.constructor.name
          });

          // Update input history
          if (action === InputAction.Move && (Math.abs(value.normalized.x) > 0.01 || Math.abs(value.normalized.y) > 0.01)) {
            // Add new input to history
            inputHistory.push({ ...value.normalized });

            // Keep history at max length
            while (inputHistory.length > this.maxInputHistoryLength) {
              inputHistory.shift();
            }

            // Apply smoothed input
            const smoothedDirection = this.getSmoothInputDirection(inputHistory);
            controller.setMoveDirection(smoothedDirection);

            // Update last facing direction when moving
            if (lastFacingDirection) {
              lastFacingDirection.x = smoothedDirection.x;
              lastFacingDirection.y = smoothedDirection.y;
            }
          } else {
            controller.setMoveDirection(value.normalized);
          }
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
   * Get a smoothed direction based on input history
   */
  private getSmoothInputDirection(inputHistory: Vector2[]): Vector2 {
    if (inputHistory.length === 0) {
      return { x: 0, y: 0 };
    }

    // Get most recent input
    const currentInput = inputHistory[inputHistory.length - 1];

    // If only one input or smoothing disabled, just return current
    if (inputHistory.length === 1 || this.inputSmoothingFactor === 0) {
      return { ...currentInput };
    }

    // Calculate average of previous inputs
    let avgX = 0;
    let avgY = 0;

    // Weight more recent inputs higher
    let totalWeight = 0;

    // Process all inputs except the most recent (already handled)
    for (let i = 0; i < inputHistory.length - 1; i++) {
      // Higher weight for more recent inputs
      const weight = (i + 1) / inputHistory.length;
      avgX += inputHistory[i].x * weight;
      avgY += inputHistory[i].y * weight;
      totalWeight += weight;
    }

    if (totalWeight > 0) {
      avgX /= totalWeight;
      avgY /= totalWeight;
    }

    // Blend between current input and history average
    const smoothedX = currentInput.x * (1 - this.inputSmoothingFactor) + avgX * this.inputSmoothingFactor;
    const smoothedY = currentInput.y * (1 - this.inputSmoothingFactor) + avgY * this.inputSmoothingFactor;

    // Normalize to ensure consistent speed in all directions
    const magnitude = Math.sqrt(smoothedX * smoothedX + smoothedY * smoothedY);

    if (magnitude > 0) {
      return {
        x: smoothedX / magnitude,
        y: smoothedY / magnitude
      };
    }

    return { x: smoothedX, y: smoothedY };
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
      this.characters.forEach((data) => {
        const { controller, inputHistory } = data;

        // Add to input history for continuity
        inputHistory.push({ ...this.lastMoveInput!.normalized });

        // Keep history at max length
        while (inputHistory.length > this.maxInputHistoryLength) {
          inputHistory.shift();
        }

        // Apply smoothed input
        const smoothedDirection = this.getSmoothInputDirection(inputHistory);
        controller.setMoveDirection(smoothedDirection);
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
    this.characters.forEach((data) => {
      const { transform, controller, lastFacingDirection, inputHistory, currentRotationDegrees } = data;

      // Update physics state
      controller.updatePhysics(safeDeltatime);

      // Apply velocity to position
      const velocity = controller.getVelocity();
      const movement = {
        x: velocity.x * safeDeltatime,
        y: velocity.y * safeDeltatime
      };

      // Special check for irregular diagonal movement
      const currentSpeed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      if (currentSpeed > 0 &&
        Math.abs(velocity.x) > 0.1 &&
        Math.abs(velocity.y) > 0.1 &&
        inputHistory.length > 1) {

        // Check for large direction changes that might cause position issues
        const lastInputs = inputHistory.slice(-2);
        const prevInput = lastInputs[0];
        const currInput = lastInputs[1];

        // Detect if we have a potentially problematic direction change
        const dotProduct = prevInput.x * currInput.x + prevInput.y * currInput.y;

        // If directions are almost opposite (dot product near -1), smooth the transition
        if (dotProduct < -0.7) {
          // Apply more gradual movement to prevent position jumping
          movement.x *= 0.5;
          movement.y *= 0.5;
        }
      }

      transform.translate(movement);

      // Get new position after movement
      const newPosition = transform.getPosition();

      // Apply screen boundaries to keep entity visible
      const boundedPosition = controller.applyScreenBoundaries(newPosition, canvasWidth, canvasHeight);

      // Only update position if boundaries were applied
      if (boundedPosition.x !== newPosition.x || boundedPosition.y !== newPosition.y) {
        transform.setPosition(boundedPosition);
      }

      // POSITION BOUNDARY CHECK
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

      // ======= SIMPLIFIED ROTATION LOGIC =======
      // Get movement or aim direction for rotation
      const moveDir = controller.getMoveDirection();
      let rotationSourceDirection: Vector2;

      // If moving significantly, update last facing direction
      if (Math.abs(moveDir.x) > 0.1 || Math.abs(moveDir.y) > 0.1) {
        lastFacingDirection.x = moveDir.x;
        lastFacingDirection.y = moveDir.y;
        rotationSourceDirection = moveDir;
      } else {
        // Use last facing direction when not moving
        rotationSourceDirection = lastFacingDirection;
      }

      // Only update rotation if we have a significant direction
      if (Math.abs(rotationSourceDirection.x) > 0.01 || Math.abs(rotationSourceDirection.y) > 0.01) {
        // Calculate target angle in degrees (0 degrees = facing right)
        const targetDegrees = Math.atan2(rotationSourceDirection.y, rotationSourceDirection.x) * (180 / Math.PI);

        // Calculate angle difference (shortest path)
        let angleDiff = targetDegrees - currentRotationDegrees;

        // Normalize to -180 to 180 range for shortest rotation path
        while (angleDiff > 180) angleDiff -= 360;
        while (angleDiff < -180) angleDiff += 360;

        // Apply smooth rotation with limited rate of change
        // Use sigmoid-like function for smoother acceleration/deceleration
        const rotationAmount = Math.sign(angleDiff) *
          Math.min(Math.abs(angleDiff), controller.getConfig().rotationSpeed * safeDeltatime * 60);

        // Update the tracked rotation value
        data.currentRotationDegrees += rotationAmount * this.rotationSmoothingFactor;

        // Ensure angles stay in proper range
        while (data.currentRotationDegrees > 180) data.currentRotationDegrees -= 360;
        while (data.currentRotationDegrees < -180) data.currentRotationDegrees += 360;

        // Apply to transform
        transform.setRotation(data.currentRotationDegrees);
      }
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