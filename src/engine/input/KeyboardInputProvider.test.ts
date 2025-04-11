import { KeyboardInputProvider } from './KeyboardInputProvider';
import { InputAction } from './types';

describe('KeyboardInputProvider', () => {
  let provider: KeyboardInputProvider;

  beforeEach(() => {
    provider = new KeyboardInputProvider();
  });

  afterEach(() => {
    provider.dispose();
  });

  describe('Button Input', () => {
    it('should track key press state', () => {
      // Simulate key press
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));

      const state = provider.getButton(InputAction.Move);
      expect(state.pressed).toBe(true);
      expect(state.justPressed).toBe(true);
    });

    it('should track key release state', () => {
      // Press and release a key
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      provider.update(16);
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));

      const state = provider.getButton(InputAction.Move);
      expect(state.pressed).toBe(false);
      expect(state.justReleased).toBe(true);
    });

    it('should accumulate key duration', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      provider.update(16); // Frame 1
      provider.update(16); // Frame 2

      const state = provider.getButton(InputAction.Move);
      expect(state.duration).toBeGreaterThan(0);
    });

    it('should handle multiple key bindings for same action', () => {
      // Test both W and ArrowUp for movement
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

      const state = provider.getButton(InputAction.Move);
      expect(state.pressed).toBe(true);
    });
  });

  describe('Axis Input', () => {
    it('should handle single axis movement', () => {
      // Press right movement key
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
      provider.update(16);

      const axis = provider.getAxis(InputAction.Move);
      expect(axis.value.x).toBe(1);
      expect(axis.value.y).toBe(0);
      expect(axis.magnitude).toBe(1);
    });

    it('should handle diagonal movement', () => {
      // Press up and right keys
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
      provider.update(16);

      const axis = provider.getAxis(InputAction.Move);
      expect(axis.magnitude).toBe(1); // Should be normalized
      expect(axis.normalized.x).toBeCloseTo(0.707, 2); // ~1/√2
      expect(axis.normalized.y).toBeCloseTo(0.707, 2);
    });

    it('should handle opposite keys canceling out', () => {
      // Press left and right simultaneously
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
      provider.update(16);

      const axis = provider.getAxis(InputAction.Move);
      expect(axis.value.x).toBe(0);
      expect(axis.magnitude).toBe(0);
    });
  });

  describe('Input Availability', () => {
    it('should always be available on desktop', () => {
      expect(provider.isAvailable()).toBe(true);
    });
  });
}); 