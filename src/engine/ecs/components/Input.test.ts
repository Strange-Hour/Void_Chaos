import { Input, MouseButton } from './Input';
import { Vector2 } from './Transform';

describe('Input', () => {
  let input: Input;

  beforeEach(() => {
    input = new Input();
  });

  it('should initialize with empty state', () => {
    expect(input.getType()).toBe('input');
    expect(input.getMousePosition()).toEqual({ x: 0, y: 0 });
    expect(input.getMouseWheel()).toBe(0);
  });

  describe('key bindings', () => {
    it('should bind and unbind actions', () => {
      input.bindAction('jump', ['Space', 'KeyW']);
      expect(input.getBindings('jump')).toEqual(['Space', 'KeyW']);

      input.unbindAction('jump');
      expect(input.getBindings('jump')).toEqual([]);
    });

    it('should return empty array for unknown actions', () => {
      expect(input.getBindings('unknown')).toEqual([]);
    });
  });

  describe('keyboard input', () => {
    it('should track key states', () => {
      input.setKeyState('KeyA', true);
      expect(input.isKeyPressed('KeyA')).toBe(true);
      expect(input.isKeyJustPressed('KeyA')).toBe(true);
      expect(input.isKeyJustReleased('KeyA')).toBe(false);

      input.update(); // Next frame
      expect(input.isKeyPressed('KeyA')).toBe(true);
      expect(input.isKeyJustPressed('KeyA')).toBe(false);
      expect(input.isKeyJustReleased('KeyA')).toBe(false);

      input.setKeyState('KeyA', false);
      expect(input.isKeyPressed('KeyA')).toBe(false);
      expect(input.isKeyJustPressed('KeyA')).toBe(false);
      expect(input.isKeyJustReleased('KeyA')).toBe(true);
    });

    it('should handle unknown keys', () => {
      expect(input.isKeyPressed('Unknown')).toBe(false);
      expect(input.isKeyJustPressed('Unknown')).toBe(false);
      expect(input.isKeyJustReleased('Unknown')).toBe(false);
    });
  });

  describe('action state', () => {
    beforeEach(() => {
      input.bindAction('move', ['KeyW', 'KeyS']);
    });

    it('should detect active actions', () => {
      input.setKeyState('KeyW', true);
      expect(input.isActionActive('move')).toBe(true);

      input.setKeyState('KeyW', false);
      expect(input.isActionActive('move')).toBe(false);
    });

    it('should detect active actions with multiple keys', () => {
      input.setKeyState('KeyS', true);
      expect(input.isActionActive('move')).toBe(true);

      input.setKeyState('KeyW', true);
      expect(input.isActionActive('move')).toBe(true);

      input.setKeyState('KeyS', false);
      expect(input.isActionActive('move')).toBe(true);

      input.setKeyState('KeyW', false);
      expect(input.isActionActive('move')).toBe(false);
    });
  });

  describe('mouse input', () => {
    it('should track mouse position', () => {
      const position: Vector2 = { x: 100, y: 200 };
      input.setMousePosition(position);
      expect(input.getMousePosition()).toEqual(position);
    });

    it('should track mouse button states', () => {
      const button: MouseButton = 'left';
      input.setMouseButtonState(button, true);
      expect(input.isMouseButtonPressed(button)).toBe(true);
      expect(input.isMouseButtonJustPressed(button)).toBe(true);
      expect(input.isMouseButtonJustReleased(button)).toBe(false);

      input.update(); // Next frame
      expect(input.isMouseButtonPressed(button)).toBe(true);
      expect(input.isMouseButtonJustPressed(button)).toBe(false);
      expect(input.isMouseButtonJustReleased(button)).toBe(false);

      input.setMouseButtonState(button, false);
      expect(input.isMouseButtonPressed(button)).toBe(false);
      expect(input.isMouseButtonJustPressed(button)).toBe(false);
      expect(input.isMouseButtonJustReleased(button)).toBe(true);
    });

    it('should track mouse wheel', () => {
      input.setMouseWheel(1);
      expect(input.getMouseWheel()).toBe(1);

      input.update(); // Next frame
      expect(input.getMouseWheel()).toBe(0);
    });
  });

  describe('serialization', () => {
    it('should serialize bindings', () => {
      input.bindAction('move', ['KeyW', 'KeyS']);
      input.bindAction('jump', ['Space']);

      const serialized = input.serialize() as {
        bindings: [string, string[]][];
      };

      expect(serialized.bindings).toEqual([
        ['move', ['KeyW', 'KeyS']],
        ['jump', ['Space']]
      ]);
    });

    it('should deserialize bindings', () => {
      const data: { bindings: [string, string[]][] } = {
        bindings: [
          ['move', ['KeyW', 'KeyS']],
          ['jump', ['Space']]
        ]
      };

      input.deserialize(data);
      expect(input.getBindings('move')).toEqual(['KeyW', 'KeyS']);
      expect(input.getBindings('jump')).toEqual(['Space']);
    });

    it('should handle empty deserialization', () => {
      input.bindAction('move', ['KeyW', 'KeyS']);
      input.deserialize({});
      expect(input.getBindings('move')).toEqual(['KeyW', 'KeyS']);
    });
  });
}); 