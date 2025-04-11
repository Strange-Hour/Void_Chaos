import { EnemyFactory, EnemySpawnOptions } from './EnemyFactory';
import { Enemy, EnemyType } from '../components/Enemy';
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
      expect(enemyComponent.getEnemyType()).toBe(EnemyType.Basic);

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
      expect(ai.getCurrentState()).toBe('chase');
      expect(ai.getBehavior('chase')).toBeDefined();
      expect(ai.getBehavior('idle')).toBeDefined();
    });

    it('should create different enemy types with correct configurations', () => {
      const types = [EnemyType.Basic, EnemyType.Flanker, EnemyType.Ranged];
      const expectedStates = ['chase', 'chase', 'keepDistance'];

      types.forEach((type, index) => {
        const enemy = EnemyFactory.createEnemy({
          ...defaultSpawnOptions,
          type,
        });

        const enemyComponent = enemy.getComponent('enemy') as Enemy;
        expect(enemyComponent.getEnemyType()).toBe(type);

        const ai = enemy.getComponent('ai') as AI;
        expect(ai.getCurrentState()).toBe(expectedStates[index]);
      });
    });

    it('should set AI target when provided', () => {
      const options: EnemySpawnOptions = {
        ...defaultSpawnOptions,
        aiTarget: { x: 300, y: 400, type: 'player' },
      };

      const enemy = EnemyFactory.createEnemy(options);
      const ai = enemy.getComponent('ai') as AI;
      const target = ai.getTarget();

      expect(target).toBeDefined();
      expect(target?.position).toEqual({ x: 300, y: 400 });
      expect(target?.type).toBe('player');
    });

    it('should create enemies with type-specific health values', () => {
      const types = [EnemyType.Basic, EnemyType.Flanker, EnemyType.Ranged];
      const expectedHealth = [100, 75, 50];

      types.forEach((type, index) => {
        const enemy = EnemyFactory.createEnemy({
          ...defaultSpawnOptions,
          type,
        });

        const health = enemy.getComponent('health') as Health;
        expect(health.getMaxHealth()).toBe(expectedHealth[index]);
        expect(health.getCurrentHealth()).toBe(expectedHealth[index]);
      });
    });
  });
}); 