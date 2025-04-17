/**
 * Core input system types and interfaces
 */

export interface Vector2 {
  x: number;
  y: number;
}

/**
 * Represents the current state of an input axis (e.g., movement direction)
 */
export interface InputAxis {
  value: Vector2;
  normalized: Vector2;
  magnitude: number;
  active: boolean;  // Whether the axis is currently being used
}

/**
 * Represents a button or key state
 */
export interface ButtonState {
  pressed: boolean;
  justPressed: boolean;
  justReleased: boolean;
  duration: number;
}

/**
 * Input device types supported by the system
 */
export enum InputDeviceType {
  Keyboard = 'keyboard',
  Mouse = 'mouse',
  Touch = 'touch',
  Gamepad = 'gamepad'
}

/**
 * Standard input actions that can be mapped to different input methods
 */
export enum InputAction {
  Move = 'move',
  Aim = 'aim',
  PrimaryAction = 'primaryAction',
  SecondaryAction = 'secondaryAction',
  Interact = 'interact',
  Menu = 'menu',
  Debug = 'debug'
}

/**
 * Configuration for input buffering
 */
export interface InputBufferConfig {
  enabled: boolean;
  duration: number; // Duration in milliseconds to buffer inputs
}

/**
 * Base interface for all input providers
 */
export interface IInputProvider {
  readonly deviceType: InputDeviceType;
  isAvailable(): boolean;
  update(deltaTime: number): void;
  getAxis(action: InputAction): InputAxis;
  getButton(action: InputAction): ButtonState;
  dispose(): void;
}

/**
 * Configuration options for the InputManager
 */
export interface InputManagerConfig {
  bufferConfig?: InputBufferConfig;
  enableKeyboard?: boolean;
  enableMouse?: boolean;
  enableTouch?: boolean;
  enableGamepad?: boolean;
}

/**
 * Interface for input event subscribers
 */
export interface IInputEventSubscriber {
  onInputActionStart?(action: InputAction): void;
  onInputActionEnd?(action: InputAction): void;
  onInputAxisChange?(action: InputAction, value: InputAxis): void;
} 