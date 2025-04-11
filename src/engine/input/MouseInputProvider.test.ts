/**
 * @jest-environment jsdom
 */

import { MouseInputProvider } from '@engine/input/MouseInputProvider';
import { InputAction } from '@engine/input/types';

describe('MouseInputProvider', () => {
  let provider: MouseInputProvider;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    // Setup canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);

    // Mock canvas getBoundingClientRect
    jest.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => ({})
    });

    provider = new MouseInputProvider(canvas);
  });

  afterEach(() => {
    provider.dispose();
    document.body.removeChild(canvas);
    jest.restoreAllMocks();
  });

  describe('Button Input', () => {
    it('should track mouse button press state', () => {
      // Create and dispatch mousedown event
      const mouseDown = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        button: 0,
        clientX: 100,
        clientY: 100
      });
      canvas.dispatchEvent(mouseDown);

      const state = provider.getButton(InputAction.PrimaryAction);
      expect(state.pressed).toBe(true);
      expect(state.justPressed).toBe(true);
    });

    it('should track mouse button release state', () => {
      // Press and release left button
      const mouseDown = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        button: 0,
        clientX: 100,
        clientY: 100
      });
      canvas.dispatchEvent(mouseDown);
      provider.update(16);

      const mouseUp = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        button: 0,
        clientX: 100,
        clientY: 100
      });
      canvas.dispatchEvent(mouseUp);

      const state = provider.getButton(InputAction.PrimaryAction);
      expect(state.pressed).toBe(false);
      expect(state.justReleased).toBe(true);
    });

    it('should accumulate button press duration', () => {
      const mouseDown = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        button: 0,
        clientX: 100,
        clientY: 100
      });
      canvas.dispatchEvent(mouseDown);

      provider.update(16); // Frame 1
      provider.update(16); // Frame 2

      const state = provider.getButton(InputAction.PrimaryAction);
      expect(state.duration).toBe(32); // 2 frames * 16ms
    });

    it('should handle right click as secondary action', () => {
      const mouseDown = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        button: 2,
        clientX: 100,
        clientY: 100
      });
      canvas.dispatchEvent(mouseDown);

      const state = provider.getButton(InputAction.SecondaryAction);
      expect(state.pressed).toBe(true);
    });
  });

  describe('Aim Input', () => {
    it('should handle mouse movement for aiming', () => {
      const mouseMove = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: 400, // Center X
        clientY: 300  // Center Y
      });
      canvas.dispatchEvent(mouseMove);
      provider.update(16);

      const axis = provider.getAxis(InputAction.Aim);
      expect(axis.value.x).toBeCloseTo(0, 2);
      expect(axis.value.y).toBeCloseTo(0, 2);
    });

    it('should normalize aim coordinates', () => {
      const mouseMove = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: 800, // Right edge
        clientY: 0    // Top edge
      });
      canvas.dispatchEvent(mouseMove);
      provider.update(16);

      const axis = provider.getAxis(InputAction.Aim);
      expect(axis.normalized.x).toBe(1);
      expect(axis.normalized.y).toBe(1);
      expect(axis.magnitude).toBeLessThanOrEqual(1);
    });

    it('should track mouse movement between updates', () => {
      // Initial position
      const moveStart = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: 0,
        clientY: 0
      });
      canvas.dispatchEvent(moveStart);
      provider.update(16);

      // Move to new position
      const moveEnd = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100
      });
      canvas.dispatchEvent(moveEnd);
      provider.update(16);

      const movement = provider.getMovement();
      expect(movement.x).toBe(100);
      expect(movement.y).toBe(100);
    });
  });

  describe('Input Availability', () => {
    it('should always be available on desktop', () => {
      expect(provider.isAvailable()).toBe(true);
    });
  });

  describe('Context Menu', () => {
    it('should prevent context menu on right click', () => {
      const contextMenu = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true
      });

      // We need to spy on preventDefault before dispatching the event
      const preventDefault = jest.spyOn(contextMenu, 'preventDefault');
      canvas.dispatchEvent(contextMenu);

      expect(preventDefault).toHaveBeenCalled();
    });
  });
}); 