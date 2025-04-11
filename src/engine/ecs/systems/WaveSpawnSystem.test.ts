import { WaveSpawnSystem, WaveConfig, SpawnPoint } from './WaveSpawnSystem';
import { Entity } from '@engine/ecs/Entity';
import { EnemyType } from '@engine/ecs/components/Enemy';
import { Transform } from '@engine/ecs/components/Transform';
import { World } from '@engine/ecs/World';


describe('WaveSpawnSystem', () => {
  let system: WaveSpawnSystem;
  let world: World;
  let player: Entity;

  const testWaves: WaveConfig[] = [
    {
      enemies: [
        { type: EnemyType.Basic, count: 2 },
        { type: EnemyType.Ranged, count: 1 }
      ],
      spawnDelay: 1000,
      waveDelay: 2000
    },
    {
      enemies: [
        { type: EnemyType.Flanker, count: 2 },
        { type: EnemyType.Basic, count: 2 }
      ],
      spawnDelay: 800,
      waveDelay: 2000
    }
  ];

  const testSpawnPoints: SpawnPoint[] = [
    { position: { x: 0, y: 0 }, weight: 1 },
    { position: { x: 100, y: 0 }, weight: 1 },
    { position: { x: 0, y: 100 }, weight: 1 }
  ];

  beforeEach(() => {
    world = new World();
    system = new WaveSpawnSystem(world);

    // Create and add player entity
    player = new Entity();
    const transform = new Transform({ x: 50, y: 50 });
    player.addComponent(transform);
    world.addEntity(player);

    // Configure the wave system
    system.configure(testWaves, testSpawnPoints);
  });

  afterEach(() => {
    world.clear();
  });

  describe('Wave Management', () => {
    it('should start with no active wave', () => {
      expect(system.getCurrentWave()).toBe(1);
      expect(system.isComplete()).toBe(false);
      expect(system.getRemainingEnemies()).toBe(0);
    });

    it('should start next wave when called', () => {
      const success = system.startNextWave();
      expect(success).toBe(true);
      expect(system.getRemainingEnemies()).toBe(3); // 2 Basic + 1 Ranged
    });

    it('should not start wave if all waves are complete', () => {
      system.startNextWave(); // Wave 1
      system.startNextWave(); // Wave 2
      const success = system.startNextWave(); // Should fail
      expect(success).toBe(false);
      expect(system.isComplete()).toBe(true);
    });
  });

  describe('Enemy Spawning', () => {
    it('should spawn enemies with delay', () => {
      system.startNextWave();

      // No enemies should spawn immediately
      system.update(100); // 100ms
      expect(world.getEntities().length).toBe(1); // Just the player

      // First enemy should spawn after spawnDelay
      system.update(1000); // 1000ms more
      expect(world.getEntities().length).toBe(2); // Player + 1 enemy
    });

    it('should spawn enemies at valid spawn points', () => {
      system.startNextWave();
      system.update(1000); // Spawn first enemy

      const entities = world.getEntities();
      const enemy = entities.find((e: Entity) => e.hasComponent('enemy'));
      expect(enemy).toBeDefined();

      const transform = enemy?.getComponent('transform') as Transform;
      expect(transform).toBeDefined();

      const position = transform.getPosition();
      const isValidSpawnPoint = testSpawnPoints.some(point =>
        point.position.x === position.x && point.position.y === position.y
      );
      expect(isValidSpawnPoint).toBe(true);
    });

    it('should target player with spawned enemies', () => {
      system.startNextWave();
      system.update(1000); // Spawn first enemy

      const enemy = world.getEntities().find((e: Entity) => e.hasComponent('enemy'));
      expect(enemy).toBeDefined();

      const ai = enemy?.getComponent('ai');
      expect(ai).toBeDefined();

      const target = ai?.getTarget();
      expect(target).toBeDefined();
      expect(target?.type).toBe('player');
    });
  });

  describe('Wave Progression', () => {
    it('should progress to next wave after all enemies are spawned', () => {
      system.startNextWave();

      // Spawn all enemies from first wave
      system.update(1000); // First enemy
      system.update(1000); // Second enemy
      system.update(1000); // Third enemy

      // Wait for wave delay
      system.update(2000);

      // Should automatically start next wave
      expect(system.getCurrentWave()).toBe(2);
      expect(system.getRemainingEnemies()).toBe(4); // 2 Flankers + 2 Basic
    });

    it('should handle wave completion', () => {
      // Complete first wave
      system.startNextWave();
      system.update(1000); // First enemy
      system.update(1000); // Second enemy
      system.update(1000); // Third enemy
      system.update(2000); // Wave delay

      // Complete second wave
      system.update(1000); // First enemy
      system.update(1000); // Second enemy
      system.update(1000); // Third enemy
      system.update(1000); // Fourth enemy
      system.update(2000); // Wave delay

      expect(system.isComplete()).toBe(true);
      expect(system.getCurrentWave()).toBe(3); // 1-based indexing
      expect(system.getRemainingEnemies()).toBe(0);
    });
  });

  describe('System Reset', () => {
    it('should reset to initial state', () => {
      // Progress through some waves
      system.startNextWave();
      system.update(5000); // Spawn some enemies

      // Reset the system
      system.reset();

      expect(system.getCurrentWave()).toBe(1);
      expect(system.getRemainingEnemies()).toBe(0);
      expect(system.isComplete()).toBe(false);
    });
  });
}); 