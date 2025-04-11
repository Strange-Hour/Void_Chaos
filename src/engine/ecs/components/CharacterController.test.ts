import { CharacterController, CharacterControllerConfig } from '@engine/ecs/components/CharacterController';
import { Vector2 } from '@engine/math/Vector2';

describe('CharacterController', () => {
  let controller: CharacterController;

  beforeEach(() => {
    controller = new CharacterController();
  });

  describe('Movement Direction', () => {
    it('should set move direction', () => {
      const direction = { x: 1, y: 0 };
      controller.setMoveDirection(direction);
      expect(controller.getVelocity()).toEqual({ x: 0, y: 0 }); // Initial velocity should be 0
    });

    it('should update physics with movement', () => {
      const direction = { x: 1, y: 0 };
      controller.setMoveDirection(direction);
      controller.updatePhysics(1); // 1 second update
      const velocity = controller.getVelocity();
      expect(velocity.x).toBeGreaterThan(0);
      expect(velocity.y).toBe(0);
    });

    it('should respect max speed', () => {
      const direction = { x: 1, y: 0 };
      controller.setMoveDirection(direction);

      // Update for several seconds to reach max speed
      for (let i = 0; i < 10; i++) {
        controller.updatePhysics(1);
      }

      const velocity = controller.getVelocity();
      expect(Math.abs(velocity.x)).toBeLessThanOrEqual(300); // Default max speed
      expect(velocity.y).toBe(0);
    });

    it('should decelerate when not moving', () => {
      // First accelerate
      controller.setMoveDirection({ x: 1, y: 0 });
      controller.updatePhysics(1);
      const initialVelocity = controller.getVelocity().x;

      // Then stop moving
      controller.setMoveDirection({ x: 0, y: 0 });
      controller.updatePhysics(1);
      const finalVelocity = controller.getVelocity().x;

      expect(finalVelocity).toBeLessThan(initialVelocity);
    });
  });

  describe('Aim Direction', () => {
    it('should set aim direction', () => {
      const direction = { x: 0, y: 1 };
      controller.setAimDirection(direction);
      expect(controller.getAimDirection()).toEqual(direction);
    });

    it('should maintain aim direction during movement', () => {
      const aimDirection = { x: 0, y: 1 };
      const moveDirection = { x: 1, y: 0 };

      controller.setAimDirection(aimDirection);
      controller.setMoveDirection(moveDirection);
      controller.updatePhysics(1);

      expect(controller.getAimDirection()).toEqual(aimDirection);
    });
  });

  describe('Physics Behavior', () => {
    it('should apply friction', () => {
      // First get moving
      controller.setMoveDirection({ x: 1, y: 0 });
      controller.updatePhysics(0.5);
      const initialVelocity = controller.getVelocity().x;

      // Then let friction slow us down
      controller.setMoveDirection({ x: 0, y: 0 });
      controller.updatePhysics(0.5);
      const finalVelocity = controller.getVelocity().x;

      expect(finalVelocity).toBeLessThan(initialVelocity);
    });

    it('should handle diagonal movement', () => {
      const direction = { x: 1, y: 1 };
      controller.setMoveDirection(direction);
      controller.updatePhysics(1);

      const velocity = controller.getVelocity();
      expect(velocity.x).toBeGreaterThan(0);
      expect(velocity.y).toBeGreaterThan(0);

      // Diagonal movement should not exceed max speed
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      expect(speed).toBeLessThanOrEqual(300); // Default max speed
    });

    it('should stop completely at very low speeds', () => {
      // First get moving slowly
      controller.setMoveDirection({ x: 0.1, y: 0 });
      controller.updatePhysics(0.1);

      // Then stop and let friction work
      controller.setMoveDirection({ x: 0, y: 0 });
      for (let i = 0; i < 10; i++) {
        controller.updatePhysics(0.1);
      }

      const velocity = controller.getVelocity();
      expect(velocity.x).toBe(0);
      expect(velocity.y).toBe(0);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize correctly', () => {
      // Set up some state
      controller.setMoveDirection({ x: 1, y: 0 });
      controller.setAimDirection({ x: 0, y: 1 });
      controller.updatePhysics(1);

      // Serialize
      const data = controller.serialize() as {
        config: CharacterControllerConfig;
        velocity: Vector2;
        moveDirection: Vector2;
        aimDirection: Vector2;
        isMoving: boolean;
      };

      // Create new controller and deserialize
      const newController = new CharacterController();
      newController.deserialize(data);

      // Compare states
      expect(newController.getVelocity()).toEqual(controller.getVelocity());
      expect(newController.getAimDirection()).toEqual(controller.getAimDirection());
    });
  });
}); 