import { CharacterControllerSystem } from '@engine/ecs/systems/CharacterControllerSystem';
import { InputManager } from '@engine/input/InputManager';
import { Entity } from '@engine/ecs/Entity';
import { Transform } from '@engine/ecs/components/Transform';
import { CharacterController } from '@engine/ecs/components/CharacterController';
import { InputAction } from '@engine/input/types';

jest.mock('@engine/input/InputManager');

describe('CharacterControllerSystem', () => {
  let system: CharacterControllerSystem;
  let inputManager: jest.Mocked<InputManager>;
  let entity: Entity;
  let transform: Transform;
  let controller: CharacterController;

  beforeEach(() => {
    inputManager = new InputManager() as jest.Mocked<InputManager>;
    system = new CharacterControllerSystem(inputManager);

    // Create test entity with required components
    entity = new Entity();
    transform = new Transform();
    controller = new CharacterController();

    // Mock component type getters
    jest.spyOn(transform, 'getType').mockReturnValue('transform');
    jest.spyOn(controller, 'getType').mockReturnValue('character-controller');

    // Add components to entity
    jest.spyOn(entity, 'getComponent').mockImplementation((type: string) => {
      if (type === 'transform') return transform;
      if (type === 'character-controller') return controller;
      return undefined;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Entity Management', () => {
    it('should add entity with required components', () => {
      const result = system.addEntity(entity);
      expect(result).toBe(true);
    });

    it('should not add entity without required components', () => {
      const emptyEntity = new Entity();
      jest.spyOn(emptyEntity, 'getComponent').mockReturnValue(undefined);

      const result = system.addEntity(emptyEntity);
      expect(result).toBe(false);
    });
  });

  describe('Input Handling', () => {
    beforeEach(() => {
      system.addEntity(entity);
    });

    it('should handle move input', () => {
      const moveValue = {
        value: { x: 1, y: 0 },
        normalized: { x: 1, y: 0 },
        magnitude: 1
      };

      system.onInputAxisChange(InputAction.Move, moveValue);
      system.fixedUpdate(1 / 60); // One frame at 60 FPS

      const velocity = controller.getVelocity();
      expect(velocity.x).toBeGreaterThan(0);
      expect(velocity.y).toBe(0);
    });

    it('should handle aim input', () => {
      const aimValue = {
        value: { x: 0, y: 1 },
        normalized: { x: 0, y: 1 },
        magnitude: 1
      };

      system.onInputAxisChange(InputAction.Aim, aimValue);
      system.fixedUpdate(1 / 60);

      const aimDir = controller.getAimDirection();
      expect(aimDir).toEqual({ x: 0, y: 1 });
    });
  });

  describe('Physics Updates', () => {
    beforeEach(() => {
      system.addEntity(entity);
    });

    it('should update position based on velocity', () => {
      // Set movement direction
      system.onInputAxisChange(InputAction.Move, {
        value: { x: 1, y: 0 },
        normalized: { x: 1, y: 0 },
        magnitude: 1
      });

      const initialPosition = transform.getPosition();
      system.fixedUpdate(1 / 60);
      const finalPosition = transform.getPosition();

      expect(finalPosition.x).toBeGreaterThan(initialPosition.x);
      expect(finalPosition.y).toBe(initialPosition.y);
    });

    it('should update rotation based on aim direction', () => {
      // Set aim direction upward
      system.onInputAxisChange(InputAction.Aim, {
        value: { x: 0, y: 1 },
        normalized: { x: 0, y: 1 },
        magnitude: 1
      });

      const initialRotation = transform.getRotation();
      system.fixedUpdate(1 / 60);
      const finalRotation = transform.getRotation();

      expect(finalRotation).not.toBe(initialRotation);
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe from input manager on dispose', () => {
      system.dispose();
      expect(inputManager.unsubscribe).toHaveBeenCalledWith(system);
    });
  });
}); 