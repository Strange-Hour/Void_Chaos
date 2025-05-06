import { EnemyFactory, EnemySpawnOptions } from './EnemyFactory';
import { Enemy } from '../components/Enemy';
import { Transform } from '../components/Transform';
import { AI } from '../components/AI';
import { Health } from '../components/Health';
import { Collider } from '../components/Collider';

describe('EnemyFactory', () => {
  const defaultSpawnOptions: EnemySpawnOptions = {
    position: { x: 100, y: 200 },
  };

  describe('createEnemy', () => {
    it('should create a basic enemy with default type', () => {
      const enemy = EnemyFactory.createEnemy(defaultSpawnOptions);

      // Check components exist
      expect(enemy.getComponent('enemy')).toBeDefined();
      expect(enemy.getComponent('transform')).toBeDefined();
      expect(enemy.getComponent('health')).toBeDefined();
      expect(enemy.getComponent('collider')).toBeDefined();
      expect(enemy.getComponent('ai')).toBeDefined();

      // Check enemy type
      const enemyComponent = enemy.getComponent('enemy') as Enemy;
      expect(enemyComponent.getEnemyTypeId()).toBe('basic');

      // Check position
      const transform = enemy.getComponent('transform') as Transform;
      const position = transform.getPosition();
      expect(position.x).toBe(100);
      expect(position.y).toBe(200);

      // Check health configuration
      const health = enemy.getComponent('health') as Health;
      expect(health.getMaxHealth()).toBe(100); // Basic enemy health
      expect(health.getCurrentHealth()).toBe(100);

      // Check collider configuration
      const collider = enemy.getComponent('collider') as Collider;
      const bounds = collider.getBounds();
      expect(bounds.width).toBe(32);
      expect(bounds.height).toBe(32);
      expect(bounds.offset).toEqual({ x: -16, y: -16 });
      expect(collider.isTriggerCollider()).toBe(false);

      // Check AI configuration
      const ai = enemy.getComponent('ai') as AI;
      expect(ai.getCurrentPatternId()).toBe('chase');
      expect(ai.getAvailablePatterns()['chase']).toBeDefined();
      expect(ai.getAvailablePatterns()['idle']).toBeDefined();
    });

    it('should create different enemy types with correct configurations', () => {
      const types = ['basic', 'flanker', 'ranged'];
      const expectedStates = ['chase', 'flank', 'keep_distance'];

      types.forEach((typeId, index) => {
        const enemy = EnemyFactory.createEnemy({
          ...defaultSpawnOptions,
          typeId,
        });

        const enemyComponent = enemy.getComponent('enemy') as Enemy;
        expect(enemyComponent.getEnemyTypeId()).toBe(typeId);

        const ai = enemy.getComponent('ai') as AI;
        expect(ai.getCurrentPatternId()).toBe(expectedStates[index]);
      });
    });

    it('should set AI target when provided', () => {
      const options: EnemySpawnOptions = {
        ...defaultSpawnOptions,
        aiTarget: { x: 300, y: 400 },
      };

      const enemy = EnemyFactory.createEnemy(options);
      const ai = enemy.getComponent('ai') as AI;
      const target = ai.getTarget();

      expect(target).toBeDefined();
      expect(target?.position).toEqual({ x: 300, y: 400 });
    });

    it('should create enemies with type-specific health values', () => {
      const types = ['basic', 'flanker', 'ranged'];
      const expectedHealth = [100, 75, 50];

      types.forEach((typeId, index) => {
        const enemy = EnemyFactory.createEnemy({
          ...defaultSpawnOptions,
          typeId,
        });

        const health = enemy.getComponent('health') as Health;
        expect(health.getMaxHealth()).toBe(expectedHealth[index]);
        expect(health.getCurrentHealth()).toBe(expectedHealth[index]);
      });
    });

    it('should set the correct color on the AI component for each enemy type', () => {
      const typeColorMap = {
        basic: '#ef4444',
        flanker: '#ec4899',
        ranged: '#eab308',
        bomber: '#f97316',
      };
      Object.entries(typeColorMap).forEach(([typeId, expectedColor]) => {
        const enemy = EnemyFactory.createEnemy({
          position: { x: 0, y: 0 },
          typeId,
        });
        const ai = enemy.getComponent('ai') as AI;
        expect(ai).toBeDefined();
        expect(ai.getColor()).toBe(expectedColor);
      });
    });

    it('should return an empty entity and log an error for unknown type', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => { });
      const enemy = EnemyFactory.createEnemy({
        position: { x: 0, y: 0 },
        typeId: 'unknown_type',
      });
      expect(enemy.getComponent('enemy')).toBeUndefined();
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('Failed to create enemy: Type definition not found'));
      spy.mockRestore();
    });
  });
}); 