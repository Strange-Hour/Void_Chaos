import {
  IInputProvider,
  InputDeviceType,
  InputAction,
  ButtonState,
  InputAxis,
  Vector2
} from './types';

type MouseButtonMapping = {
  [InputAction.PrimaryAction]: number;
  [InputAction.SecondaryAction]: number;
};

/**
 * Default mouse button mappings
 */
const DEFAULT_BUTTON_MAPPINGS: MouseButtonMapping = {
  [InputAction.PrimaryAction]: 0, // Left click
  [InputAction.SecondaryAction]: 2 // Right click
};

/**
 * Provides mouse input handling for the input system
 */
export class MouseInputProvider implements IInputProvider {
  readonly deviceType = InputDeviceType.Mouse;
  private position: Vector2;
  private previousPosition: Vector2;
  private pressedButtons: Set<number>;
  private justPressedButtons: Set<number>;
  private justReleasedButtons: Set<number>;
  private buttonDurations: Map<number, number>;
  private buttonMappings: MouseButtonMapping;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, buttonMappings: MouseButtonMapping = DEFAULT_BUTTON_MAPPINGS) {
    this.canvas = canvas;
    this.position = { x: 0, y: 0 };
    this.previousPosition = { x: 0, y: 0 };
    this.pressedButtons = new Set();
    this.justPressedButtons = new Set();
    this.justReleasedButtons = new Set();
    this.buttonDurations = new Map();
    this.buttonMappings = buttonMappings;

    // Set up event listeners
    canvas.addEventListener('mousedown', this.handleMouseDown);
    canvas.addEventListener('mouseup', this.handleMouseUp);
    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('contextmenu', this.handleContextMenu);
  }

  /**
   * Checks if mouse input is available
   */
  isAvailable(): boolean {
    return true; // Mouse is always available on desktop
  }

  /**
   * Updates the input state
   */
  update(deltaTime: number): void {
    // Update button durations
    this.pressedButtons.forEach(button => {
      const currentDuration = this.buttonDurations.get(button) || 0;
      this.buttonDurations.set(button, currentDuration + deltaTime);
    });

    // Store previous position
    this.previousPosition = { ...this.position };

    // Clear one-frame states
    this.justPressedButtons.clear();
    this.justReleasedButtons.clear();
  }

  /**
   * Gets the current state of an input action
   */
  getButton(action: InputAction): ButtonState {
    if (action in this.buttonMappings) {
      const button = this.buttonMappings[action as keyof MouseButtonMapping];
      return {
        pressed: this.pressedButtons.has(button),
        justPressed: this.justPressedButtons.has(button),
        justReleased: this.justReleasedButtons.has(button),
        duration: this.pressedButtons.has(button)
          ? this.buttonDurations.get(button) || 0
          : 0
      };
    }

    return {
      pressed: false,
      justPressed: false,
      justReleased: false,
      duration: 0
    };
  }

  /**
   * Gets the current axis value for an input action
   */
  getAxis(action: InputAction): InputAxis {
    if (action === InputAction.Aim) {
      // Convert mouse position to canvas-relative coordinates
      const rect = this.canvas.getBoundingClientRect();
      const x = ((this.position.x - rect.left) / rect.width) * 2 - 1;
      const y = ((this.position.y - rect.top) / rect.height) * -2 + 1;

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
   * Gets the current mouse position in screen coordinates
   */
  getPosition(): Vector2 {
    return { ...this.position };
  }

  /**
   * Gets the mouse movement since last update
   */
  getMovement(): Vector2 {
    return {
      x: this.position.x - this.previousPosition.x,
      y: this.position.y - this.previousPosition.y
    };
  }

  /**
   * Cleans up event listeners
   */
  dispose(): void {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    this.pressedButtons.clear();
    this.justPressedButtons.clear();
    this.justReleasedButtons.clear();
    this.buttonDurations.clear();
  }

  /**
   * Handles mouse down events
   */
  private handleMouseDown = (event: MouseEvent): void => {
    const button = event.button;
    if (!this.pressedButtons.has(button)) {
      this.pressedButtons.add(button);
      this.justPressedButtons.add(button);
      this.buttonDurations.set(button, 0);
    }
  };

  /**
   * Handles mouse up events
   */
  private handleMouseUp = (event: MouseEvent): void => {
    const button = event.button;
    this.pressedButtons.delete(button);
    this.justReleasedButtons.add(button);
    this.buttonDurations.delete(button);
  };

  /**
   * Handles mouse move events
   */
  private handleMouseMove = (event: MouseEvent): void => {
    this.position = {
      x: event.clientX,
      y: event.clientY
    };
  };

  /**
   * Prevents context menu from appearing on right click
   */
  private handleContextMenu = (event: Event): void => {
    event.preventDefault();
  };
} 