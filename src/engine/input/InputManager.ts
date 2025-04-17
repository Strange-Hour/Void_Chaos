import {
  InputAction,
  InputAxis,
  ButtonState,
  InputDeviceType,
  IInputProvider,
  InputManagerConfig,
  IInputEventSubscriber,
  Vector2
} from './types';

/**
 * Default configuration for the input manager
 */
const DEFAULT_CONFIG: Required<InputManagerConfig> = {
  bufferConfig: {
    enabled: true,
    duration: 100 // 100ms buffer window
  },
  enableKeyboard: true,
  enableMouse: true,
  enableTouch: true,
  enableGamepad: false
};

/**
 * Manages all input handling and provides a unified interface for game input
 */
export class InputManager {
  private providers: Map<InputDeviceType, IInputProvider>;
  private subscribers: Set<IInputEventSubscriber>;
  private config: Required<InputManagerConfig>;
  private inputBuffer: Map<InputAction, ButtonState>;
  private lastAxisValues: Map<InputAction, InputAxis>;

  constructor(config: InputManagerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.providers = new Map();
    this.subscribers = new Set();
    this.inputBuffer = new Map();
    this.lastAxisValues = new Map();

    // Initialize with empty states
    Object.values(InputAction).forEach(action => {
      this.inputBuffer.set(action, {
        pressed: false,
        justPressed: false,
        justReleased: false,
        duration: 0
      });
      this.lastAxisValues.set(action, {
        value: { x: 0, y: 0 },
        normalized: { x: 0, y: 0 },
        magnitude: 0,
        active: false
      });
    });
  }

  /**
   * Registers an input provider for a specific device type
   */
  registerProvider(provider: IInputProvider): void {
    if (this.providers.has(provider.deviceType)) {
      console.warn(`Replacing existing provider for device type: ${provider.deviceType}`);
      this.providers.get(provider.deviceType)?.dispose();
    }
    this.providers.set(provider.deviceType, provider);
  }

  /**
   * Subscribes to input events
   */
  subscribe(subscriber: IInputEventSubscriber): void {
    this.subscribers.add(subscriber);
  }

  /**
   * Unsubscribes from input events
   */
  unsubscribe(subscriber: IInputEventSubscriber): void {
    this.subscribers.delete(subscriber);
  }

  /**
   * Updates all input providers and processes input events
   */
  update(deltaTime: number): void {
    // Update all providers
    Array.from(this.providers.values()).forEach(provider => {
      if (provider.isAvailable()) {
        provider.update(deltaTime);
      }
    });

    // Process input actions with more detailed logging
    Object.values(InputAction).forEach(action => {
      this.processAction(action, deltaTime);
      this.processAxis(action);
    });

    // Debug log active axes (Move and Aim)
    const moveAxis = this.lastAxisValues.get(InputAction.Move);
    if (moveAxis && moveAxis.magnitude > 0) {
      console.log('Active Move Axis:', {
        value: moveAxis.value,
        normalized: moveAxis.normalized,
        magnitude: moveAxis.magnitude
      });
    }
  }

  /**
   * Gets the current state of an input action
   */
  getButton(action: InputAction): ButtonState {
    const state = this.inputBuffer.get(action) || {
      pressed: false,
      justPressed: false,
      justReleased: false,
      duration: 0
    };
    return { ...state };
  }

  /**
   * Gets the current axis value for an input action
   */
  getAxis(action: InputAction): InputAxis {
    const axis = this.lastAxisValues.get(action) || {
      value: { x: 0, y: 0 },
      normalized: { x: 0, y: 0 },
      magnitude: 0,
      active: false
    };
    return { ...axis };
  }

  /**
   * Disposes of all input providers and cleans up resources
   */
  dispose(): void {
    Array.from(this.providers.values()).forEach(provider => {
      provider.dispose();
    });
    this.providers.clear();
    this.subscribers.clear();
    this.inputBuffer.clear();
    this.lastAxisValues.clear();
  }

  /**
   * Processes button state for an input action
   */
  private processAction(action: InputAction, deltaTime: number): void {
    let isPressed = false;
    let maxDuration = 0;

    // Check all providers for the action state
    Array.from(this.providers.values()).forEach(provider => {
      if (provider.isAvailable()) {
        const state = provider.getButton(action);
        if (state.pressed) {
          isPressed = true;
          maxDuration = Math.max(maxDuration, state.duration);
        }
      }
    });

    // Get current state
    const currentState = this.inputBuffer.get(action)!;
    const wasPressed = currentState.pressed;

    // Update state
    const newState: ButtonState = {
      pressed: isPressed,
      justPressed: isPressed && !wasPressed,
      justReleased: !isPressed && wasPressed,
      duration: isPressed ? maxDuration + deltaTime : 0
    };

    // Apply input buffering if enabled
    if (this.config.bufferConfig.enabled && newState.justPressed) {
      setTimeout(() => {
        const state = this.inputBuffer.get(action);
        if (state && state.justPressed) {
          state.justPressed = false;
          this.inputBuffer.set(action, state);
        }
      }, this.config.bufferConfig.duration);
    }

    this.inputBuffer.set(action, newState);

    // Notify subscribers
    if (newState.justPressed) {
      this.subscribers.forEach(sub => sub.onInputActionStart?.(action));
    } else if (newState.justReleased) {
      this.subscribers.forEach(sub => sub.onInputActionEnd?.(action));
    }
  }

  /**
   * Processes axis values for an input action
   */
  private processAxis(action: InputAction): void {
    const resultAxis: Vector2 = { x: 0, y: 0 };
    let hasInput = false;

    // Combine axis values from all providers
    Array.from(this.providers.values()).forEach(provider => {
      if (provider.isAvailable()) {
        const axis = provider.getAxis(action);
        if (axis.magnitude > 0) {
          resultAxis.x += axis.value.x;
          resultAxis.y += axis.value.y;
          hasInput = true;

          // Debug which provider is giving input
          console.log(`Provider ${provider.deviceType} has active input for ${action}:`, axis);
        }
      }
    });

    // Normalize the combined axis value
    const magnitude = Math.sqrt(resultAxis.x * resultAxis.x + resultAxis.y * resultAxis.y);
    const normalized = magnitude > 0
      ? { x: resultAxis.x / magnitude, y: resultAxis.y / magnitude }
      : { x: 0, y: 0 };

    const newAxis: InputAxis = {
      value: resultAxis,
      normalized,
      magnitude: Math.min(magnitude, 1),
      active: hasInput
    };

    const lastAxis = this.lastAxisValues.get(action)!;
    const hasChanged =
      lastAxis.magnitude !== newAxis.magnitude ||
      lastAxis.normalized.x !== newAxis.normalized.x ||
      lastAxis.normalized.y !== newAxis.normalized.y;

    if (hasInput || lastAxis.magnitude > 0) {
      if (hasChanged) {
        console.log(`InputManager: Axis ${action} changed:`, {
          from: { mag: lastAxis.magnitude, norm: lastAxis.normalized },
          to: { mag: newAxis.magnitude, norm: newAxis.normalized }
        });

        this.lastAxisValues.set(action, newAxis);
        this.subscribers.forEach(sub => {
          if (sub.onInputAxisChange) {
            console.log(`Notifying subscriber ${sub.constructor.name} of axis change`);
            sub.onInputAxisChange(action, newAxis);
          }
        });
      }
    }
  }
} 