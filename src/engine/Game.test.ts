import { Game, GameConfig } from './Game';
import { Entity } from './ecs/Entity';
import { System } from './ecs/System';
import { Component } from './ecs/Entity';

// Mock Canvas class
jest.mock('./Canvas', () => {
  return {
    Canvas: jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      destroy: jest.fn(),
      addRenderCallback: jest.fn(),
    })),
  };
});

// Test component
class TestComponent extends Component {
  getType(): string {
    return 'test';
  }

  serialize(): object {
    return {};
  }

  deserialize(_data: object): void {
    // No data to deserialize
  }
}

// Test system with fixed update
class FixedUpdateSystem extends System {
  private updateCount = 0;
  private fixedUpdateCount = 0;

  constructor() {
    super(['test']);
  }

  update(_deltaTime: number): void {
    this.updateCount++;
  }

  fixedUpdate(_deltaTime: number): void {
    this.fixedUpdateCount++;
  }

  getUpdateCount(): number {
    return this.updateCount;
  }

  getFixedUpdateCount(): number {
    return this.fixedUpdateCount;
  }
}

// Test system with interpolated update
class InterpolatedSystem extends System {
  private updateCount = 0;
  private interpolatedUpdateCount = 0;
  private lastAlpha = 0;

  constructor() {
    super(['test']);
  }

  update(_deltaTime: number): void {
    this.updateCount++;
  }

  interpolatedUpdate(_deltaTime: number, alpha: number): void {
    this.interpolatedUpdateCount++;
    this.lastAlpha = alpha;
  }

  getUpdateCount(): number {
    return this.updateCount;
  }

  getInterpolatedUpdateCount(): number {
    return this.interpolatedUpdateCount;
  }

  getLastAlpha(): number {
    return this.lastAlpha;
  }
}

describe('Game', () => {
  let game: Game;
  let config: GameConfig;

  beforeEach(() => {
    config = {
      width: 800,
      height: 600,
      fixedTimeStep: 16.67, // 60 FPS
    };
    game = new Game(config);
  });

  afterEach(() => {
    game.destroy();
    jest.clearAllMocks();
  });

  describe('entity management', () => {
    it('should add and remove entities', () => {
      const entity = new Entity();
      game.addEntity(entity);
      expect(game.getEntity(entity.getId())).toBe(entity);

      game.removeEntity(entity);
      expect(game.getEntity(entity.getId())).toBeUndefined();
    });

    it('should add entities to relevant systems', () => {
      const system = new FixedUpdateSystem();
      const entity = new Entity();
      entity.addComponent(new TestComponent());

      game.addSystem(system);
      game.addEntity(entity);

      expect(system.getEntities()).toContain(entity);
    });
  });

  describe('system management', () => {
    it('should add and remove systems', () => {
      const system = new FixedUpdateSystem();
      const entity = new Entity();
      entity.addComponent(new TestComponent());

      game.addEntity(entity);
      game.addSystem(system);
      expect(system.getEntities()).toContain(entity);

      game.removeSystem(system);
      expect(system.getEntities()).toContain(entity); // System still has entity, but won't be updated
    });

    it('should handle both fixed and interpolated systems', () => {
      const fixedSystem = new FixedUpdateSystem();
      const interpolatedSystem = new InterpolatedSystem();

      game.addSystem(fixedSystem);
      game.addSystem(interpolatedSystem);

      // Trigger an update cycle
      const updateCallback = ((game as unknown) as { update: (deltaTime: number) => void }).update;
      updateCallback.call(game, 16.67); // One frame at 60 FPS

      // Should have called fixedUpdate at least once
      expect(fixedSystem.getFixedUpdateCount()).toBeGreaterThan(0);
      expect(interpolatedSystem.getInterpolatedUpdateCount()).toBe(1);
      expect(interpolatedSystem.getLastAlpha()).toBeGreaterThanOrEqual(0);
      expect(interpolatedSystem.getLastAlpha()).toBeLessThanOrEqual(1);
    });
  });

  describe('game loop', () => {
    it('should start and stop the game loop', () => {
      const canvas = ((game as unknown) as { canvas: { start: () => void; stop: () => void } }).canvas;

      game.start();
      expect(canvas.start).toHaveBeenCalled();

      game.stop();
      expect(canvas.stop).toHaveBeenCalled();
    });

    it('should clean up resources on destroy', () => {
      const canvas = ((game as unknown) as { canvas: { destroy: () => void } }).canvas;
      const entity = new Entity();
      const system = new FixedUpdateSystem();

      game.addEntity(entity);
      game.addSystem(system);

      game.destroy();

      expect(canvas.destroy).toHaveBeenCalled();
      expect(game.getEntity(entity.getId())).toBeUndefined();
      expect(((game as unknown) as { systems: System[] }).systems.length).toBe(0);
    });
  });
}); 