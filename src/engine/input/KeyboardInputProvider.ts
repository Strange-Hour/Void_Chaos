import {
  IInputProvider,
  InputDeviceType,
  InputAction,
  ButtonState,
  InputAxis,
  Vector2
} from './types';

type DirectionalMapping = {
  up: string[];
  down: string[];
  left: string[];
  right: string[];
};

type KeyMappings = {
  [InputAction.Move]: DirectionalMapping;
  [InputAction.PrimaryAction]: string[];
  [InputAction.SecondaryAction]: string[];
  [InputAction.Interact]: string[];
  [InputAction.Menu]: string[];
  [InputAction.Aim]: never; // Aim is handled by mouse
};

/**
 * Default keyboard key mappings for input actions
 */
const DEFAULT_KEY_MAPPINGS: KeyMappings = {
  [InputAction.Move]: {
    up: ['w', 'ArrowUp'],
    down: ['s', 'ArrowDown'],
    left: ['a', 'ArrowLeft'],
    right: ['d', 'ArrowRight']
  },
  [InputAction.PrimaryAction]: ['Space', ' '],
  [InputAction.SecondaryAction]: ['Shift'],
  [InputAction.Interact]: ['e', 'Enter'],
  [InputAction.Menu]: ['Escape'],
  [InputAction.Aim]: undefined as never
};

/**
 * Provides keyboard input handling for the input system
 */
export class KeyboardInputProvider implements IInputProvider {
  readonly deviceType = InputDeviceType.Keyboard;
  private pressedKeys: Set<string>;
  private justPressedKeys: Set<string>;
  private justReleasedKeys: Set<string>;
  private keyDurations: Map<string, number>;
  private keyMappings: KeyMappings;

  constructor(keyMappings: KeyMappings = DEFAULT_KEY_MAPPINGS) {
    this.pressedKeys = new Set();
    this.justPressedKeys = new Set();
    this.justReleasedKeys = new Set();
    this.keyDurations = new Map();
    this.keyMappings = keyMappings;

    // Set up event listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  /**
   * Checks if the keyboard input is available
   */
  isAvailable(): boolean {
    return true; // Keyboard is always available on desktop
  }

  /**
   * Updates the input state
   */
  update(deltaTime: number): void {
    // Update key durations
    this.pressedKeys.forEach(key => {
      const currentDuration = this.keyDurations.get(key) || 0;
      this.keyDurations.set(key, currentDuration + deltaTime);
    });

    // Clear one-frame states
    this.justPressedKeys.clear();
    this.justReleasedKeys.clear();
  }

  /**
   * Gets the current state of an input action
   */
  getButton(action: InputAction): ButtonState {
    if (action === InputAction.Aim) {
      return {
        pressed: false,
        justPressed: false,
        justReleased: false,
        duration: 0
      };
    }

    const keys = Array.isArray(this.keyMappings[action])
      ? this.keyMappings[action] as string[]
      : [];

    const pressed = keys.some(key => this.pressedKeys.has(key));
    const justPressed = keys.some(key => this.justPressedKeys.has(key));
    const justReleased = keys.some(key => this.justReleasedKeys.has(key));
    const duration = pressed
      ? Math.max(...keys.map(key => this.keyDurations.get(key) || 0))
      : 0;

    return {
      pressed,
      justPressed,
      justReleased,
      duration
    };
  }

  /**
   * Gets the current axis value for an input action
   */
  getAxis(action: InputAction): InputAxis {
    if (action === InputAction.Move) {
      const mapping = this.keyMappings[action];
      const x =
        (this.isAnyKeyPressed(mapping.right) ? 1 : 0) -
        (this.isAnyKeyPressed(mapping.left) ? 1 : 0);
      const y =
        (this.isAnyKeyPressed(mapping.up) ? 1 : 0) -
        (this.isAnyKeyPressed(mapping.down) ? 1 : 0);

      const value: Vector2 = { x, y };
      const magnitude = Math.sqrt(x * x + y * y);
      const normalized: Vector2 =
        magnitude > 0 ? { x: x / magnitude, y: y / magnitude } : { x: 0, y: 0 };

      return {
        value,
        normalized,
        magnitude: Math.min(magnitude, 1)
      };
    }

    return {
      value: { x: 0, y: 0 },
      normalized: { x: 0, y: 0 },
      magnitude: 0
    };
  }

  /**
   * Cleans up event listeners
   */
  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.pressedKeys.clear();
    this.justPressedKeys.clear();
    this.justReleasedKeys.clear();
    this.keyDurations.clear();
  }

  /**
   * Handles keydown events
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    const key = event.key;
    if (!this.pressedKeys.has(key)) {
      this.pressedKeys.add(key);
      this.justPressedKeys.add(key);
      this.keyDurations.set(key, 0);
    }
  };

  /**
   * Handles keyup events
   */
  private handleKeyUp = (event: KeyboardEvent): void => {
    const key = event.key;
    this.pressedKeys.delete(key);
    this.justReleasedKeys.add(key);
    this.keyDurations.delete(key);
  };

  /**
   * Checks if any of the given keys are pressed
   */
  private isAnyKeyPressed(keys: string[]): boolean {
    return keys.some(key => this.pressedKeys.has(key));
  }
} 