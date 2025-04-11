/**
 * @jest-environment jsdom
 */

import { TouchInputProvider } from '@engine/input/TouchInputProvider';
import { InputAction } from '@engine/input/types';

describe('TouchInputProvider', () => {
  let provider: TouchInputProvider;
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

    provider = new TouchInputProvider(canvas);
  });

  afterEach(() => {
    provider.dispose();
    document.body.removeChild(canvas);
    jest.restoreAllMocks();
  });

  describe('Movement Joystick', () => {
    it('should handle touch start in movement zone', () => {
      const touch = new Touch({
        identifier: 0,
        target: canvas,
        clientX: 100, // Left side of screen (movement zone)
        clientY: 300,
        pageX: 100,
        pageY: 300,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 1
      });

      const touchStart = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [touch]
      });
      canvas.dispatchEvent(touchStart);
      provider.update(16);

      const axis = provider.getAxis(InputAction.Move);
      expect(axis.value).toEqual({ x: 0, y: 0 });
      expect(axis.normalized).toEqual({ x: 0, y: 0 });
      expect(axis.magnitude).toBe(0);
      expect(axis.active).toBe(false);
    });

    it('should track joystick movement', () => {
      // Start touch
      const startTouch = new Touch({
        identifier: 0,
        target: canvas,
        clientX: 100,
        clientY: 300,
        pageX: 100,
        pageY: 300,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 1
      });

      const touchStart = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [startTouch]
      });
      canvas.dispatchEvent(touchStart);

      // Move touch
      const moveTouch = new Touch({
        identifier: 0,
        target: canvas,
        clientX: 150,
        clientY: 300,
        pageX: 150,
        pageY: 300,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 1
      });

      const touchMove = new TouchEvent('touchmove', {
        bubbles: true,
        cancelable: true,
        touches: [moveTouch]
      });
      canvas.dispatchEvent(touchMove);
      provider.update(16);

      const axis = provider.getAxis(InputAction.Move);
      expect(axis.normalized.x).toBeGreaterThan(0);
      expect(axis.magnitude).toBeLessThanOrEqual(1);
      expect(axis.active).toBe(true);
    });

    it('should reset movement on touch end', () => {
      // Start touch
      const touch = new Touch({
        identifier: 0,
        target: canvas,
        clientX: 100,
        clientY: 300,
        pageX: 100,
        pageY: 300,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 1
      });

      const touchStart = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [touch]
      });
      canvas.dispatchEvent(touchStart);

      const touchEnd = new TouchEvent('touchend', {
        bubbles: true,
        cancelable: true,
        touches: []
      });
      canvas.dispatchEvent(touchEnd);
      provider.update(16);

      const axis = provider.getAxis(InputAction.Move);
      expect(axis.value).toEqual({ x: 0, y: 0 });
      expect(axis.normalized).toEqual({ x: 0, y: 0 });
      expect(axis.magnitude).toBe(0);
      expect(axis.active).toBe(false);
    });
  });

  describe('Aim Joystick', () => {
    it('should handle touch start in aim zone', () => {
      const touch = new Touch({
        identifier: 0,
        target: canvas,
        clientX: 700, // Right side of screen (aim zone)
        clientY: 300,
        pageX: 700,
        pageY: 300,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 1
      });

      const touchStart = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [touch]
      });
      canvas.dispatchEvent(touchStart);
      provider.update(16);

      const axis = provider.getAxis(InputAction.Aim);
      expect(axis.magnitude).toBe(0);
      expect(axis.active).toBe(false);
    });

    it('should track aim joystick movement', () => {
      // Start touch
      const startTouch = new Touch({
        identifier: 0,
        target: canvas,
        clientX: 700,
        clientY: 300,
        pageX: 700,
        pageY: 300,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 1
      });

      const touchStart = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [startTouch]
      });
      canvas.dispatchEvent(touchStart);

      // Move touch diagonally
      const moveTouch = new Touch({
        identifier: 0,
        target: canvas,
        clientX: 750,
        clientY: 350,
        pageX: 750,
        pageY: 350,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 1
      });

      const touchMove = new TouchEvent('touchmove', {
        bubbles: true,
        cancelable: true,
        touches: [moveTouch]
      });
      canvas.dispatchEvent(touchMove);
      provider.update(16);

      const axis = provider.getAxis(InputAction.Aim);
      expect(axis.normalized.x).toBeGreaterThan(0);
      expect(axis.normalized.y).toBeGreaterThan(0);
      expect(axis.magnitude).toBeLessThanOrEqual(1);
      expect(axis.active).toBe(true);
    });
  });

  describe('Action Buttons', () => {
    it('should trigger primary action on touch in action zone', () => {
      const touch = new Touch({
        identifier: 0,
        target: canvas,
        clientX: 700,
        clientY: 500, // Bottom right (action zone)
        pageX: 700,
        pageY: 500,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 1
      });

      const touchStart = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [touch]
      });
      canvas.dispatchEvent(touchStart);

      const state = provider.getButton(InputAction.PrimaryAction);
      expect(state.pressed).toBe(true);
      expect(state.justPressed).toBe(true);
    });

    it('should track action button duration', () => {
      const touch = new Touch({
        identifier: 0,
        target: canvas,
        clientX: 700,
        clientY: 500,
        pageX: 700,
        pageY: 500,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 1
      });

      const touchStart = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [touch]
      });
      canvas.dispatchEvent(touchStart);

      provider.update(16); // Frame 1
      provider.update(16); // Frame 2

      const state = provider.getButton(InputAction.PrimaryAction);
      expect(state.duration).toBe(32); // 2 frames * 16ms
    });
  });

  describe('Input Availability', () => {
    it('should check touch support for availability', () => {
      // Mock touch support
      const originalTouchPoints = navigator.maxTouchPoints;
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 5,
        configurable: true
      });

      expect(provider.isAvailable()).toBe(true);

      // Reset mock
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: originalTouchPoints,
        configurable: true
      });
    });

    it('should be unavailable when touch is not supported', () => {
      // Mock no touch support
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        configurable: true
      });

      expect(provider.isAvailable()).toBe(false);

      // Reset mock
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: navigator.maxTouchPoints,
        configurable: true
      });
    });
  });

  describe('Multi-touch Handling', () => {
    it('should handle multiple touches in different zones', () => {
      // Start movement touch
      const moveTouch = new Touch({
        identifier: 0,
        target: canvas,
        clientX: 100,
        clientY: 300,
        pageX: 100,
        pageY: 300,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 1
      });

      const moveEvent = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [moveTouch]
      });
      canvas.dispatchEvent(moveEvent);

      // Add aim touch
      const aimTouch = new Touch({
        identifier: 1,
        target: canvas,
        clientX: 700,
        clientY: 300,
        pageX: 700,
        pageY: 300,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 1
      });

      const multiTouchEvent = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [moveTouch, aimTouch]
      });
      canvas.dispatchEvent(multiTouchEvent);
      provider.update(16);

      const moveAxis = provider.getAxis(InputAction.Move);
      const aimAxis = provider.getAxis(InputAction.Aim);
      expect(moveAxis.magnitude).toBe(0); // Initial touch at center
      expect(aimAxis.magnitude).toBe(0); // Initial touch at center
    });
  });
}); 