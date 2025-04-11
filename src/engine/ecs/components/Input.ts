import { Component } from '../Entity';
import { Vector2 } from './Transform';

export type KeyState = {
  isPressed: boolean;
  wasPressed: boolean;
};

export type MouseButton = 'left' | 'middle' | 'right';

export type TouchZone = 'movement' | 'aim' | 'action';

export interface TouchState {
  active: boolean;
  position: Vector2;
  startPosition: Vector2;
  identifier: number;
  zone: TouchZone;
}

export interface InputState {
  keys: Map<string, KeyState>;
  mousePosition: Vector2;
  mouseButtons: Map<MouseButton, KeyState>;
  mouseWheel: number;
  touches: Map<number, TouchState>;
  virtualJoysticks: {
    movement: Vector2;
    aim: Vector2;
  };
}

/**
 * Input component for handling keyboard, mouse, and touch input
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
      mouseWheel: 0,
      touches: new Map(),
      virtualJoysticks: {
        movement: { x: 0, y: 0 },
        aim: { x: 0, y: 0 }
      }
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
   * Update touch state
   */
  setTouchState(identifier: number, state: Partial<TouchState>): void {
    const currentState = this.state.touches.get(identifier);
    if (!currentState && state.position) {
      // New touch
      this.state.touches.set(identifier, {
        active: true,
        position: { ...state.position },
        startPosition: { ...state.position },
        identifier,
        zone: state.zone || 'action'
      });
    } else if (currentState && state.position) {
      // Update existing touch
      this.state.touches.set(identifier, {
        ...currentState,
        ...state,
        position: { ...state.position }
      });
    } else if (currentState && state.active === false) {
      // Remove touch
      this.state.touches.delete(identifier);
    }
  }

  /**
   * Get all active touches
   */
  getActiveTouches(): TouchState[] {
    return Array.from(this.state.touches.values());
  }

  /**
   * Get touches in a specific zone
   */
  getTouchesInZone(zone: TouchZone): TouchState[] {
    return this.getActiveTouches().filter(touch => touch.zone === zone);
  }

  /**
   * Set virtual joystick value
   */
  setVirtualJoystick(type: 'movement' | 'aim', value: Vector2): void {
    this.state.virtualJoysticks[type] = { ...value };
  }

  /**
   * Get virtual joystick value
   */
  getVirtualJoystick(type: 'movement' | 'aim'): Vector2 {
    return { ...this.state.virtualJoysticks[type] };
  }

  /**
   * Update input states for the next frame
   */
  update(): void {
    // Update wasPressed states for keys and mouse buttons
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