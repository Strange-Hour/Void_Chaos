import { InputManager } from './InputManager';
import {
  InputAction,
  InputAxis,
  ButtonState,
  InputDeviceType,
  IInputProvider,
  Vector2
} from './types';

// Mock input provider for testing
class MockInputProvider implements IInputProvider {
  readonly deviceType = InputDeviceType.Keyboard;
  private buttonStates: Map<InputAction, ButtonState>;
  private axisValues: Map<InputAction, InputAxis>;

  constructor() {
    this.buttonStates = new Map();
    this.axisValues = new Map();

    // Initialize with default states
    Object.values(InputAction).forEach(action => {
      this.buttonStates.set(action, {
        pressed: false,
        justPressed: false,
        justReleased: false,
        duration: 0
      });
      this.axisValues.set(action, {
        value: { x: 0, y: 0 },
        normalized: { x: 0, y: 0 },
        magnitude: 0
      });
    });
  }

  isAvailable(): boolean {
    return true;
  }

  update(deltaTime: number): void {
    // Update button durations
    this.buttonStates.forEach(state => {
      if (state.pressed) {
        state.duration += deltaTime;
      }
    });
  }

  getButton(action: InputAction): ButtonState {
    return this.buttonStates.get(action) || {
      pressed: false,
      justPressed: false,
      justReleased: false,
      duration: 0
    };
  }

  getAxis(action: InputAction): InputAxis {
    return this.axisValues.get(action) || {
      value: { x: 0, y: 0 },
      normalized: { x: 0, y: 0 },
      magnitude: 0
    };
  }

  setButtonState(action: InputAction, state: ButtonState): void {
    this.buttonStates.set(action, state);
  }

  setAxisValue(action: InputAction, value: Vector2): void {
    const magnitude = Math.sqrt(value.x * value.x + value.y * value.y);
    const normalized = magnitude > 0
      ? { x: value.x / magnitude, y: value.y / magnitude }
      : { x: 0, y: 0 };

    this.axisValues.set(action, {
      value,
      normalized,
      magnitude: Math.min(magnitude, 1)
    });
  }

  dispose(): void {
    this.buttonStates.clear();
    this.axisValues.clear();
  }
}

describe('InputManager', () => {
  let inputManager: InputManager;
  let mockProvider: MockInputProvider;

  beforeEach(() => {
    inputManager = new InputManager();
    mockProvider = new MockInputProvider();
    inputManager.registerProvider(mockProvider);
  });

  afterEach(() => {
    inputManager.dispose();
  });

  describe('Button Input', () => {
    it('should track button press state', () => {
      mockProvider.setButtonState(InputAction.PrimaryAction, {
        pressed: true,
        justPressed: true,
        justReleased: false,
        duration: 0
      });

      inputManager.update(16); // Simulate one frame at 60fps

      const state = inputManager.getButton(InputAction.PrimaryAction);
      expect(state.pressed).toBe(true);
      expect(state.justPressed).toBe(true);
    });

    it('should track button release state', () => {
      // First press the button
      mockProvider.setButtonState(InputAction.PrimaryAction, {
        pressed: true,
        justPressed: true,
        justReleased: false,
        duration: 0
      });
      inputManager.update(16);

      // Then release it
      mockProvider.setButtonState(InputAction.PrimaryAction, {
        pressed: false,
        justPressed: false,
        justReleased: true,
        duration: 16
      });
      inputManager.update(16);

      const state = inputManager.getButton(InputAction.PrimaryAction);
      expect(state.pressed).toBe(false);
      expect(state.justReleased).toBe(true);
    });

    it('should accumulate button duration', () => {
      mockProvider.setButtonState(InputAction.PrimaryAction, {
        pressed: true,
        justPressed: true,
        justReleased: false,
        duration: 0
      });

      inputManager.update(16); // Frame 1
      inputManager.update(16); // Frame 2

      const state = inputManager.getButton(InputAction.PrimaryAction);
      expect(state.duration).toBeGreaterThan(0);
    });
  });

  describe('Axis Input', () => {
    it('should handle axis values', () => {
      const testValue: Vector2 = { x: 1, y: 0 }; // Moving right
      mockProvider.setAxisValue(InputAction.Move, testValue);

      inputManager.update(16);

      const axis = inputManager.getAxis(InputAction.Move);
      expect(axis.value).toEqual(testValue);
      expect(axis.magnitude).toBe(1);
      expect(axis.normalized).toEqual(testValue);
    });

    it('should normalize diagonal movement', () => {
      const testValue: Vector2 = { x: 1, y: 1 }; // Moving diagonally
      mockProvider.setAxisValue(InputAction.Move, testValue);

      inputManager.update(16);

      const axis = inputManager.getAxis(InputAction.Move);
      expect(axis.magnitude).toBe(1);
      expect(axis.normalized.x).toBeCloseTo(0.707, 2); // ~1/√2
      expect(axis.normalized.y).toBeCloseTo(0.707, 2);
    });

    it('should handle zero movement', () => {
      const testValue: Vector2 = { x: 0, y: 0 };
      mockProvider.setAxisValue(InputAction.Move, testValue);

      inputManager.update(16);

      const axis = inputManager.getAxis(InputAction.Move);
      expect(axis.value).toEqual(testValue);
      expect(axis.magnitude).toBe(0);
      expect(axis.normalized).toEqual(testValue);
    });
  });

  describe('Input Events', () => {
    it('should notify subscribers of button events', () => {
      const subscriber = {
        onInputActionStart: jest.fn(),
        onInputActionEnd: jest.fn()
      };

      inputManager.subscribe(subscriber);

      // Test button press
      mockProvider.setButtonState(InputAction.PrimaryAction, {
        pressed: true,
        justPressed: true,
        justReleased: false,
        duration: 0
      });
      inputManager.update(16);

      expect(subscriber.onInputActionStart).toHaveBeenCalledWith(InputAction.PrimaryAction);

      // Test button release
      mockProvider.setButtonState(InputAction.PrimaryAction, {
        pressed: false,
        justPressed: false,
        justReleased: true,
        duration: 16
      });
      inputManager.update(16);

      expect(subscriber.onInputActionEnd).toHaveBeenCalledWith(InputAction.PrimaryAction);
    });

    it('should notify subscribers of axis changes', () => {
      const subscriber = {
        onInputAxisChange: jest.fn()
      };

      inputManager.subscribe(subscriber);

      const testValue: Vector2 = { x: 1, y: 0 };
      mockProvider.setAxisValue(InputAction.Move, testValue);
      inputManager.update(16);

      expect(subscriber.onInputAxisChange).toHaveBeenCalled();
      const call = subscriber.onInputAxisChange.mock.calls[0];
      expect(call[0]).toBe(InputAction.Move);
      expect(call[1].value).toEqual(testValue);
    });
  });
}); 