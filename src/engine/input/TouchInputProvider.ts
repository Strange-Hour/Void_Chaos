import {
  IInputProvider,
  InputDeviceType,
  InputAction,
  ButtonState,
  InputAxis,
  Vector2
} from './types';

interface VirtualJoystick {
  active: boolean;
  center: Vector2;
  current: Vector2;
  startId: number;
}

interface TouchZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Configuration for touch input zones and behavior
 */
interface TouchConfig {
  moveJoystickZone: TouchZone;
  aimJoystickZone: TouchZone;
  joystickRadius: number;
  deadzone: number;
}

/**
 * Default touch input configuration
 */
const DEFAULT_TOUCH_CONFIG: TouchConfig = {
  moveJoystickZone: {
    x: 0,
    y: 0.5,
    width: 0.5,
    height: 0.5
  },
  aimJoystickZone: {
    x: 0.5,
    y: 0.5,
    width: 0.5,
    height: 0.5
  },
  joystickRadius: 50,
  deadzone: 0.1
};

/**
 * Provides touch input handling with virtual joysticks
 */
export class TouchInputProvider implements IInputProvider {
  readonly deviceType = InputDeviceType.Touch;
  private canvas: HTMLCanvasElement;
  private config: TouchConfig;
  private moveJoystick: VirtualJoystick;
  private aimJoystick: VirtualJoystick;
  private activeTouches: Map<number, Touch>;
  private touchDurations: Map<number, number>;

  constructor(canvas: HTMLCanvasElement, config: TouchConfig = DEFAULT_TOUCH_CONFIG) {
    this.canvas = canvas;
    this.config = config;
    this.activeTouches = new Map();
    this.touchDurations = new Map();

    this.moveJoystick = {
      active: false,
      center: { x: 0, y: 0 },
      current: { x: 0, y: 0 },
      startId: -1
    };

    this.aimJoystick = {
      active: false,
      center: { x: 0, y: 0 },
      current: { x: 0, y: 0 },
      startId: -1
    };

    // Set up event listeners
    canvas.addEventListener('touchstart', this.handleTouchStart);
    canvas.addEventListener('touchmove', this.handleTouchMove);
    canvas.addEventListener('touchend', this.handleTouchEnd);
    canvas.addEventListener('touchcancel', this.handleTouchEnd);
  }

  /**
   * Checks if touch input is available
   */
  isAvailable(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Updates the input state
   */
  update(deltaTime: number): void {
    // Update touch durations
    this.activeTouches.forEach((touch, id) => {
      const currentDuration = this.touchDurations.get(id) || 0;
      this.touchDurations.set(id, currentDuration + deltaTime);
    });
  }

  /**
   * Gets the current state of an input action
   */
  getButton(action: InputAction): ButtonState {
    switch (action) {
      case InputAction.PrimaryAction:
        return {
          pressed: this.aimJoystick.active,
          justPressed: false, // Handled in touch events
          justReleased: false, // Handled in touch events
          duration: this.aimJoystick.active
            ? this.touchDurations.get(this.aimJoystick.startId) || 0
            : 0
        };
      default:
        return {
          pressed: false,
          justPressed: false,
          justReleased: false,
          duration: 0
        };
    }
  }

  /**
   * Gets the current axis value for an input action
   */
  getAxis(action: InputAction): InputAxis {
    let joystick: VirtualJoystick;

    switch (action) {
      case InputAction.Move:
        joystick = this.moveJoystick;
        break;
      case InputAction.Aim:
        joystick = this.aimJoystick;
        break;
      default:
        return {
          value: { x: 0, y: 0 },
          normalized: { x: 0, y: 0 },
          magnitude: 0
        };
    }

    if (!joystick.active) {
      return {
        value: { x: 0, y: 0 },
        normalized: { x: 0, y: 0 },
        magnitude: 0
      };
    }

    const dx = joystick.current.x - joystick.center.x;
    const dy = joystick.current.y - joystick.center.y;
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    const normalizedMagnitude = Math.min(
      1,
      Math.max(0, (magnitude - this.config.deadzone) / (this.config.joystickRadius - this.config.deadzone))
    );

    if (magnitude < this.config.deadzone) {
      return {
        value: { x: 0, y: 0 },
        normalized: { x: 0, y: 0 },
        magnitude: 0
      };
    }

    const normalizedX = dx / magnitude;
    const normalizedY = dy / magnitude;

    return {
      value: {
        x: normalizedX * normalizedMagnitude,
        y: normalizedY * normalizedMagnitude
      },
      normalized: { x: normalizedX, y: normalizedY },
      magnitude: normalizedMagnitude
    };
  }

  /**
   * Cleans up event listeners
   */
  dispose(): void {
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    this.canvas.removeEventListener('touchcancel', this.handleTouchEnd);
    this.activeTouches.clear();
    this.touchDurations.clear();
  }

  /**
   * Handles touch start events
   */
  private handleTouchStart = (event: TouchEvent): void => {
    event.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const touches = Array.from(event.changedTouches);

    touches.forEach(touch => {
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const normalizedX = x / rect.width;
      const normalizedY = y / rect.height;

      // Store touch data
      this.activeTouches.set(touch.identifier, touch);
      this.touchDurations.set(touch.identifier, 0);

      // Check which zone was touched
      if (this.isInZone(normalizedX, normalizedY, this.config.moveJoystickZone) && !this.moveJoystick.active) {
        this.moveJoystick = {
          active: true,
          center: { x, y },
          current: { x, y },
          startId: touch.identifier
        };
      } else if (this.isInZone(normalizedX, normalizedY, this.config.aimJoystickZone) && !this.aimJoystick.active) {
        this.aimJoystick = {
          active: true,
          center: { x, y },
          current: { x, y },
          startId: touch.identifier
        };
      }
    });
  };

  /**
   * Handles touch move events
   */
  private handleTouchMove = (event: TouchEvent): void => {
    event.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const touches = Array.from(event.changedTouches);

    touches.forEach(touch => {
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      if (touch.identifier === this.moveJoystick.startId) {
        this.moveJoystick.current = { x, y };
      } else if (touch.identifier === this.aimJoystick.startId) {
        this.aimJoystick.current = { x, y };
      }
    });
  };

  /**
   * Handles touch end and cancel events
   */
  private handleTouchEnd = (event: TouchEvent): void => {
    event.preventDefault();

    const touches = Array.from(event.changedTouches);

    touches.forEach(touch => {
      if (touch.identifier === this.moveJoystick.startId) {
        this.moveJoystick.active = false;
        this.moveJoystick.startId = -1;
      } else if (touch.identifier === this.aimJoystick.startId) {
        this.aimJoystick.active = false;
        this.aimJoystick.startId = -1;
      }

      this.activeTouches.delete(touch.identifier);
      this.touchDurations.delete(touch.identifier);
    });
  };

  /**
   * Checks if a point is within a touch zone
   */
  private isInZone(x: number, y: number, zone: TouchZone): boolean {
    return (
      x >= zone.x &&
      x <= zone.x + zone.width &&
      y >= zone.y &&
      y <= zone.y + zone.height
    );
  }
} 