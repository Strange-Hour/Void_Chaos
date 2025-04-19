import { GameLoop } from '../gameLoop';
import { World } from '../../ecs/World';
import { System } from '../../ecs/System';
import { Entity } from '../../ecs/Entity';

describe('GameLoop', () => {
  let gameLoop: GameLoop;
  let world: World;

  beforeEach(() => {
    gameLoop = GameLoop.getInstance();
    world = new World();
    // Stop any running loop from previous tests
    gameLoop.stop();
  });

  it('should be a singleton', () => {
    const instance1 = GameLoop.getInstance();
    const instance2 = GameLoop.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should handle update callbacks', () => {
    const mockCallback = jest.fn();
    gameLoop.addUpdateCallback(mockCallback);

    // Start the loop
    gameLoop.start();

    // Wait for a few frames
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        gameLoop.stop();
        expect(mockCallback).toHaveBeenCalled();
        // Check if deltaTime is being passed
        expect(typeof mockCallback.mock.calls[0][0]).toBe('number');
        resolve();
      }, 100);
    });
  });

  it('should handle render callbacks', () => {
    const mockCallback = jest.fn();
    gameLoop.addRenderCallback(mockCallback);

    // Start the loop
    gameLoop.start();

    // Wait for a few frames
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        gameLoop.stop();
        expect(mockCallback).toHaveBeenCalled();
        // Check if deltaTime is being passed
        expect(typeof mockCallback.mock.calls[0][0]).toBe('number');
        resolve();
      }, 100);
    });
  });

  it('should remove callbacks correctly', () => {
    const mockCallback = jest.fn();
    gameLoop.addUpdateCallback(mockCallback);
    gameLoop.removeUpdateCallback(mockCallback);

    gameLoop.start();

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        gameLoop.stop();
        expect(mockCallback).not.toHaveBeenCalled();
        resolve();
      }, 100);
    });
  });

  it('should integrate with World and handle fixed updates', () => {
    // Create a mock system to track updates
    class MockSystem extends System {
      updateCount = 0;
      fixedUpdateCount = 0;

      update(deltaTime: number): void {
        this.updateCount++;
      }

      fixedUpdate(deltaTime: number): void {
        this.fixedUpdateCount++;
      }

      shouldProcessEntity(entity: Entity): boolean {
        return true;
      }
    }

    const mockSystem = new MockSystem();
    world.addSystem(mockSystem);
    gameLoop.setWorld(world);
    gameLoop.start();

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        gameLoop.stop();

        // Should have some updates (variable timestep)
        expect(mockSystem.updateCount).toBeGreaterThan(0);

        // Should have some fixed updates (60Hz)
        expect(mockSystem.fixedUpdateCount).toBeGreaterThan(0);

        // Fixed updates should be roughly 60Hz
        // For 100ms, expect ~6 fixed updates (60Hz * 0.1s)
        expect(mockSystem.fixedUpdateCount).toBeGreaterThanOrEqual(5);
        expect(mockSystem.fixedUpdateCount).toBeLessThanOrEqual(7);

        resolve();
      }, 100);
    });
  });
}); 