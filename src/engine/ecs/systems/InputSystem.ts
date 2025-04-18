/**
 * InputSystem handles the update cycle for the input management system.
 * It bridges the gap between the ECS architecture and the input handling system.
 */
import { System } from '@engine/ecs/System';
import { InputManager } from '@engine/input/InputManager';
// Import necessary types and components
import { Entity } from '../Entity';
import { CharacterController } from '../components/CharacterController';
import { InputAction, InputAxis, IInputEventSubscriber } from '@engine/input/types';
import { Vector2 } from '@engine/math/Vector2';

/**
 * System responsible for updating the input state and applying input actions
 * to the player entity.
 */
export class InputSystem extends System implements IInputEventSubscriber {
  private inputManager: InputManager;
  // Store player entity reference for quick access
  private playerEntity: Entity | null = null;
  // Store the last non-zero movement direction for rotation
  private lastMoveDirection: Vector2 = { x: 1, y: 0 }; // Default facing right
  // Track which input type was last dominant
  private lastActiveInputType: 'move' | 'aim' | 'none' = 'none';

  // === Input Smoothing State ===
  private inputHistory: Vector2[] = [];
  private maxInputHistoryLength: number = 5; // How many past inputs to average
  private inputSmoothingFactor: number = 0.4; // 0 = no smoothing, 1 = max smoothing (uses average)
  // === End Input Smoothing State ===

  /**
   * Creates a new InputSystem
   * @param inputManager - The input manager instance to update each frame
   */
  constructor(inputManager: InputManager) {
    // Require components needed to identify and control the player
    super(['player', 'character-controller']);
    this.inputManager = inputManager;
    // Subscribe to input events
    this.inputManager.subscribe(this);
  }

  // Override addEntity to find and store the player entity
  addEntity(entity: Entity): void {
    // Check if the entity is the player based on required components
    if (this.shouldProcessEntity(entity)) {
      if (this.playerEntity) {
        console.warn('InputSystem: Multiple player entities detected. Only controlling the first one found.');
      } else {
        this.playerEntity = entity;
        this.inputHistory = []; // Reset history for new player
        this.lastMoveDirection = { x: 1, y: 0 };
        this.lastActiveInputType = 'none';
        console.log(`InputSystem: Player entity found (ID: ${entity.getId()})`);
      }
      super.addEntity(entity); // Add to the system's internal set if needed (might not be necessary)
    }
  }

  // Override removeEntity to clear the player reference if it's removed
  removeEntity(entity: Entity): void {
    if (this.playerEntity === entity) {
      this.playerEntity = null;
      this.inputHistory = [];
      console.log(`InputSystem: Player entity removed (ID: ${entity.getId()})`);
    }
    super.removeEntity(entity);
  }

  /**
   * Handle input axis changes (movement and aim) and apply them to the player.
   */
  onInputAxisChange(action: InputAction, value: InputAxis): void {
    if (!this.playerEntity) {
      // console.warn('InputSystem: Received input but no player entity found.');
      return;
    }

    // Get the player's character controller
    const controller = this.playerEntity.getComponent('character-controller') as CharacterController | undefined;

    if (!controller) {
      console.error(`InputSystem: Player entity (ID: ${this.playerEntity.getId()}) is missing CharacterController component.`);
      return;
    }

    const isActive = value.magnitude > 0.01; // Use a smaller threshold for active check

    switch (action) {
      case InputAction.Move:
        let moveInput = value.normalized;
        if (isActive) {
          // Update input history
          this.inputHistory.push({ ...value.normalized });
          if (this.inputHistory.length > this.maxInputHistoryLength) {
            this.inputHistory.shift();
          }
          // Apply smoothing
          moveInput = this.getSmoothInputDirection();
        } else {
          // If input stops, clear history quickly for responsiveness
          // Or decay it? Let's clear for now.
          this.inputHistory = [];
        }

        // Set move direction for physics
        controller.setMoveDirection(moveInput);

        if (isActive) {
          this.lastMoveDirection = { ...moveInput }; // Store smoothed direction
          this.lastActiveInputType = 'move';
          // If Aim is not active, let Move dictate rotation
          if (this.inputManager.getAxis(InputAction.Aim).magnitude <= 0.1) {
            controller.setAimDirection(moveInput); // Use smoothed direction for aim too
          }
        }
        break;

      case InputAction.Aim:
        if (isActive) {
          controller.setAimDirection(value.normalized);
          this.lastActiveInputType = 'aim';
        }
        break;
    }
  }

  // === Input Smoothing Logic ===
  private getSmoothInputDirection(): Vector2 {
    if (this.inputHistory.length === 0) {
      return { x: 0, y: 0 };
    }

    const currentInput = this.inputHistory[this.inputHistory.length - 1];

    if (this.inputHistory.length === 1 || this.inputSmoothingFactor <= 0) {
      return { ...currentInput };
    }

    // Weighted average of previous inputs (excluding current)
    let avgX = 0;
    let avgY = 0;
    let totalWeight = 0;
    for (let i = 0; i < this.inputHistory.length - 1; i++) {
      const weight = (i + 1); // Simple linear weight, older inputs matter less
      avgX += this.inputHistory[i].x * weight;
      avgY += this.inputHistory[i].y * weight;
      totalWeight += weight;
    }

    if (totalWeight > 0) {
      avgX /= totalWeight;
      avgY /= totalWeight;
    }

    // Blend current input with historical average
    const smoothX = currentInput.x * (1 - this.inputSmoothingFactor) + avgX * this.inputSmoothingFactor;
    const smoothY = currentInput.y * (1 - this.inputSmoothingFactor) + avgY * this.inputSmoothingFactor;

    // Normalize the result
    const magnitude = Math.sqrt(smoothX * smoothX + smoothY * smoothY);
    if (magnitude > 0) {
      return { x: smoothX / magnitude, y: smoothY / magnitude };
    }
    return { x: 0, y: 0 }; // Return zero vector if magnitude is zero
  }
  // === End Input Smoothing Logic ===

  // Handle button presses/releases if needed (e.g., firing)
  onInputActionStart(action: InputAction): void {
    // Example: Handle firing start
    // if (action === InputAction.Fire && this.playerEntity) {
    //     const weapon = this.playerEntity.getComponent('weapon') as Weapon | undefined;
    //     weapon?.startFiring();
    // }
  }

  onInputActionEnd(action: InputAction): void {
    // Example: Handle firing end
    // if (action === InputAction.Fire && this.playerEntity) {
    //     const weapon = this.playerEntity.getComponent('weapon') as Weapon | undefined;
    //     weapon?.stopFiring();
    // }
  }

  /**
   * Updates the input state for the current frame.
   * The actual input application happens in the event handlers.
   */
  update(deltaTime: number): void {
    // Still need to update the InputManager to process raw input
    this.inputManager.update(deltaTime);

    if (this.playerEntity) {
      const controller = this.playerEntity.getComponent('character-controller') as CharacterController | undefined;
      if (controller) {
        const currentMoveInput = this.inputManager.getAxis(InputAction.Move);
        const currentAimInput = this.inputManager.getAxis(InputAction.Aim);
        const isMoving = currentMoveInput.magnitude > 0.1;
        const isAiming = currentAimInput.magnitude > 0.1;

        if (!isMoving && !isAiming) {
          if (this.lastActiveInputType === 'move') {
            // Aim using the last *smoothed* direction when idle
            controller.setAimDirection(this.lastMoveDirection);
          }
          this.lastActiveInputType = 'none';
        } else if (isMoving && !isAiming) {
          // Ensure rotation follows smoothed movement if aim stops
          const smoothedMove = this.getSmoothInputDirection();
          if (Math.abs(smoothedMove.x) > 0.01 || Math.abs(smoothedMove.y) > 0.01) {
            controller.setAimDirection(smoothedMove);
            this.lastMoveDirection = smoothedMove; // Keep updating last direction
          }
          this.lastActiveInputType = 'move';
        } else if (!isMoving && isAiming) {
          this.lastActiveInputType = 'aim'; // Ensure aim remains dominant if move stops
        }
        // else (isMoving && isAiming) -> Aim is dominant, handled by onInputAxisChange
      }
    }
  }

  // Clean up subscription on dispose
  dispose(): void {
    if (this.inputManager) {
      this.inputManager.unsubscribe(this);
    }
    this.playerEntity = null;
    this.inputHistory = [];
  }
} 