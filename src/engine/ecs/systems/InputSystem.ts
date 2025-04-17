/**
 * InputSystem handles the update cycle for the input management system.
 * It bridges the gap between the ECS architecture and the input handling system.
 */
import { System } from '@engine/ecs/System';
import { InputManager } from '@engine/input/InputManager';

/**
 * System responsible for updating the input state each frame.
 * This system doesn't process entities directly but ensures input state is current.
 * 
 * @example
 * ```typescript
 * const inputManager = new InputManager();
 * const keyboardProvider = new KeyboardInputProvider();
 * inputManager.registerProvider(keyboardProvider);
 * 
 * const inputSystem = new InputSystem(inputManager);
 * game.addSystem(inputSystem);
 * ```
 */
export class InputSystem extends System {
  private inputManager: InputManager;

  /**
   * Creates a new InputSystem
   * @param inputManager - The input manager instance to update each frame
   */
  constructor(inputManager: InputManager) {
    super([]);  // No required components as this system just updates input
    this.inputManager = inputManager;
  }

  /**
   * Updates the input state for the current frame
   * @param deltaTime - Time elapsed since the last update in milliseconds
   */
  update(deltaTime: number): void {
    this.inputManager.update(deltaTime);
  }
} 