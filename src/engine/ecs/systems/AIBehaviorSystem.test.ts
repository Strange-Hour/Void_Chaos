import { AIBehaviorSystem } from '@engine/ecs/systems/AIBehaviorSystem';
import { Entity } from '@engine/ecs/Entity';
import { AI } from '@engine/ecs/components/AI';
import { Transform } from '@engine/ecs/components/Transform';
import { CharacterController } from '@engine/ecs/components/CharacterController';

describe('AIBehaviorSystem', () => {
  let system: AIBehaviorSystem;
  let entity: Entity;
  let ai: AI;
  let transform: Transform;
  let controller: CharacterController;

  beforeEach(() => {
    // Arrange
    system = new AIBehaviorSystem();
    entity = new Entity();
    ai = new AI();
    transform = new Transform();
    controller = new CharacterController();

    // Mock required component methods
    ai.getTarget = jest.fn().mockReturnValue({ position: { x: 100, y: 100 }, type: 'player' });
    ai.getCurrentState = jest.fn().mockReturnValue('chase');
    transform.getPosition = jest.fn().mockReturnValue({ x: 0, y: 0 });
    controller.setMoveDirection = jest.fn();
    controller.setAimDirection = jest.fn();

    // Add components to entity
    entity.getComponent = jest.fn().mockImplementation((type: string) => {
      switch (type) {
        case 'ai': return ai;
        case 'transform': return transform;
        case 'characterController': return controller;
        default: return null;
      }
    });
  });

  describe('entity management', () => {
    it('should add entity to aiEntities when onEntityAdded is called', () => {
      // Act
      system.onEntityAdded(entity);

      // Assert
      expect(entity.getComponent).toHaveBeenCalledWith('ai');
      expect(entity.getComponent).toHaveBeenCalledWith('transform');
      expect(entity.getComponent).toHaveBeenCalledWith('characterController');
    });

    it('should remove entity when onEntityRemoved is called', () => {
      // Arrange
      system.onEntityAdded(entity);

      // Act
      system.onEntityRemoved(entity);

      // Assert
      system.update(); // Should not process the removed entity
      expect(controller.setMoveDirection).not.toHaveBeenCalled();
      expect(controller.setAimDirection).not.toHaveBeenCalled();
    });
  });

  describe('behavior states', () => {
    beforeEach(() => {
      system.onEntityAdded(entity);
    });

    it('should update chase behavior correctly', () => {
      // Arrange
      ai.getCurrentState = jest.fn().mockReturnValue('chase');

      // Act
      system.update();

      // Assert
      expect(controller.setMoveDirection).toHaveBeenCalledWith(
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number)
        })
      );
      expect(controller.setAimDirection).toHaveBeenCalled();
    });

    it('should update flank behavior correctly', () => {
      // Arrange
      ai.getCurrentState = jest.fn().mockReturnValue('flank');

      // Act
      system.update();

      // Assert
      expect(controller.setMoveDirection).toHaveBeenCalledWith(
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number)
        })
      );
    });

    it('should maintain distance in keepDistance behavior', () => {
      // Arrange
      ai.getCurrentState = jest.fn().mockReturnValue('keepDistance');

      // Act
      system.update();

      // Assert
      expect(controller.setMoveDirection).toHaveBeenCalled();
      expect(controller.setAimDirection).toHaveBeenCalled();
    });

    it('should not move in idle state but still aim at target', () => {
      // Arrange
      ai.getCurrentState = jest.fn().mockReturnValue('idle');

      // Act
      system.update();

      // Assert
      expect(controller.setMoveDirection).toHaveBeenCalledWith({ x: 0, y: 0 });
      expect(controller.setAimDirection).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      system.onEntityAdded(entity);
    });

    it('should handle missing target', () => {
      // Arrange
      ai.getTarget = jest.fn().mockReturnValue(null);

      // Act
      system.update();

      // Assert
      expect(controller.setMoveDirection).not.toHaveBeenCalled();
      expect(controller.setAimDirection).not.toHaveBeenCalled();
    });

    it('should handle missing state', () => {
      // Arrange
      ai.getCurrentState = jest.fn().mockReturnValue(null);

      // Act
      system.update();

      // Assert
      expect(controller.setMoveDirection).not.toHaveBeenCalled();
      expect(controller.setAimDirection).not.toHaveBeenCalled();
    });
  });
}); 