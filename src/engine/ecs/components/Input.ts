import { Component } from '../Entity';
import { Vector2 } from './Transform';

export type KeyState = {
  isPressed: boolean;
  wasPressed: boolean;
};

export type MouseButton = 'left' | 'middle' | 'right';

export interface InputState {
  keys: Map<string, KeyState>;
  mousePosition: Vector2;
  mouseButtons: Map<MouseButton, KeyState>;
  mouseWheel: number;
}

/**
 * Input component for handling keyboard and mouse input
 */
export class Input extends Component {
  private state: InputState;
  private bindings: Map<string, string[]>;

  constructor() {
    super();
    this.state = {
      keys: new Map(),
      mousePosition: { x: 0, y: 0 },
      mouseButtons: new Map(),
      mouseWheel: 0
    };
    this.bindings = new Map();
  }

  getType(): string {
    return 'input';
  }

  /**
   * Bind an action to one or more keys
   */
  bindAction(action: string, keys: string[]): void {
    this.bindings.set(action, keys);
  }

  /**
   * Unbind an action
   */
  unbindAction(action: string): void {
    this.bindings.delete(action);
  }

  /**
   * Get all bindings for an action
   */
  getBindings(action: string): string[] {
    return this.bindings.get(action) ?? [];
  }

  /**
   * Update the state of a key
   */
  setKeyState(key: string, isPressed: boolean): void {
    const currentState = this.state.keys.get(key);
    this.state.keys.set(key, {
      isPressed,
      wasPressed: currentState?.isPressed ?? false
    });
  }

  /**
   * Check if a key is currently pressed
   */
  isKeyPressed(key: string): boolean {
    return this.state.keys.get(key)?.isPressed ?? false;
  }

  /**
   * Check if a key was just pressed this frame
   */
  isKeyJustPressed(key: string): boolean {
    const state = this.state.keys.get(key);
    return Boolean(state?.isPressed) && !state?.wasPressed;
  }

  /**
   * Check if a key was just released this frame
   */
  isKeyJustReleased(key: string): boolean {
    const state = this.state.keys.get(key);
    return !state?.isPressed && Boolean(state?.wasPressed);
  }

  /**
   * Check if an action is currently active (any of its bound keys is pressed)
   */
  isActionActive(action: string): boolean {
    const keys = this.bindings.get(action);
    return keys?.some(key => this.isKeyPressed(key)) ?? false;
  }

  /**
   * Update mouse position
   */
  setMousePosition(position: Vector2): void {
    this.state.mousePosition = { ...position };
  }

  /**
   * Get current mouse position
   */
  getMousePosition(): Vector2 {
    return { ...this.state.mousePosition };
  }

  /**
   * Update mouse button state
   */
  setMouseButtonState(button: MouseButton, isPressed: boolean): void {
    const currentState = this.state.mouseButtons.get(button);
    this.state.mouseButtons.set(button, {
      isPressed,
      wasPressed: currentState?.isPressed ?? false
    });
  }

  /**
   * Check if a mouse button is currently pressed
   */
  isMouseButtonPressed(button: MouseButton): boolean {
    return this.state.mouseButtons.get(button)?.isPressed ?? false;
  }

  /**
   * Check if a mouse button was just pressed this frame
   */
  isMouseButtonJustPressed(button: MouseButton): boolean {
    const state = this.state.mouseButtons.get(button);
    return Boolean(state?.isPressed) && !state?.wasPressed;
  }

  /**
   * Check if a mouse button was just released this frame
   */
  isMouseButtonJustReleased(button: MouseButton): boolean {
    const state = this.state.mouseButtons.get(button);
    return !state?.isPressed && Boolean(state?.wasPressed);
  }

  /**
   * Update mouse wheel delta
   */
  setMouseWheel(delta: number): void {
    this.state.mouseWheel = delta;
  }

  /**
   * Get mouse wheel delta
   */
  getMouseWheel(): number {
    return this.state.mouseWheel;
  }

  /**
   * Update input states for the next frame
   */
  update(): void {
    // Update wasPressed states
    Array.from(this.state.keys.entries()).forEach(([key, state]) => {
      this.state.keys.set(key, {
        isPressed: state.isPressed,
        wasPressed: state.isPressed
      });
    });

    Array.from(this.state.mouseButtons.entries()).forEach(([button, state]) => {
      this.state.mouseButtons.set(button, {
        isPressed: state.isPressed,
        wasPressed: state.isPressed
      });
    });

    // Reset wheel delta
    this.state.mouseWheel = 0;
  }

  serialize(): object {
    return {
      bindings: Array.from(this.bindings.entries())
    };
  }

  deserialize(data: { bindings?: [string, string[]][] }): void {
    if (data.bindings) {
      this.bindings = new Map(data.bindings);
    }
  }
} 