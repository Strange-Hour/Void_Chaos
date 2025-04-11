import { Enemy, EnemyType } from './Enemy';

describe('Enemy', () => {
  let enemy: Enemy;

  beforeEach(() => {
    enemy = new Enemy(EnemyType.Basic);
  });

  describe('initialization', () => {
    it('should initialize with default basic enemy config', () => {
      const config = enemy.getConfig();
      expect(config.type).toBe(EnemyType.Basic);
      expect(config.health).toBe(100);
      expect(config.speed).toBe(150);
      expect(config.damage).toBe(20);
      expect(enemy.getCurrentHealth()).toBe(config.health);
    });

    it('should initialize with different enemy types', () => {
      const flanker = new Enemy(EnemyType.Flanker);
      const ranged = new Enemy(EnemyType.Ranged);

      expect(flanker.getEnemyType()).toBe(EnemyType.Flanker);
      expect(ranged.getEnemyType()).toBe(EnemyType.Ranged);

      const flankerConfig = flanker.getConfig();
      expect(flankerConfig.speed).toBe(200);
      expect(flankerConfig.health).toBe(75);

      const rangedConfig = ranged.getConfig();
      expect(rangedConfig.attackRange).toBe(400);
      expect(rangedConfig.health).toBe(50);
    });
  });

  describe('health management', () => {
    it('should handle damage correctly', () => {
      enemy.takeDamage(30);
      expect(enemy.getCurrentHealth()).toBe(70);
      expect(enemy.isAlive()).toBe(true);

      enemy.takeDamage(80);
      expect(enemy.getCurrentHealth()).toBe(0);
      expect(enemy.isAlive()).toBe(false);
    });

    it('should handle healing correctly', () => {
      enemy.takeDamage(50);
      expect(enemy.getCurrentHealth()).toBe(50);

      enemy.heal(20);
      expect(enemy.getCurrentHealth()).toBe(70);

      // Should not heal above max health
      enemy.heal(50);
      expect(enemy.getCurrentHealth()).toBe(100);
    });
  });

  describe('attack system', () => {
    it('should handle attack cooldown', () => {
      const currentTime = 1000;
      expect(enemy.canAttack(currentTime)).toBe(true);

      const damage = enemy.attack(currentTime);
      expect(damage).toBe(enemy.getConfig().damage);
      expect(enemy.canAttack(currentTime)).toBe(false);
      expect(enemy.canAttack(currentTime + 500)).toBe(false);
      expect(enemy.canAttack(currentTime + 1000)).toBe(true);
    });

    it('should allow cooldown modification', () => {
      const currentTime = 1000;
      enemy.setAttackCooldown(500); // Set to 500ms

      enemy.attack(currentTime);
      expect(enemy.canAttack(currentTime + 400)).toBe(false);
      expect(enemy.canAttack(currentTime + 500)).toBe(true);
    });

    it('should return 0 damage when on cooldown', () => {
      const currentTime = 1000;
      enemy.attack(currentTime);
      expect(enemy.attack(currentTime + 500)).toBe(0);
    });
  });

  describe('scoring', () => {
    it('should return correct score values for different enemy types', () => {
      expect(enemy.getScoreValue()).toBe(100); // Basic enemy
      expect(new Enemy(EnemyType.Flanker).getScoreValue()).toBe(150);
      expect(new Enemy(EnemyType.Ranged).getScoreValue()).toBe(200);
    });
  });

  describe('serialization', () => {
    it('should serialize and deserialize correctly', () => {
      const currentTime = 1000;
      enemy.takeDamage(30);
      enemy.attack(currentTime);
      enemy.setAttackCooldown(2000);

      const serialized = enemy.serialize();
      const newEnemy = new Enemy();
      newEnemy.deserialize(serialized);

      expect(newEnemy.getCurrentHealth()).toBe(70);
      expect(newEnemy.getConfig()).toEqual(enemy.getConfig());
      expect(newEnemy.canAttack(currentTime + 1500)).toBe(false);
      expect(newEnemy.canAttack(currentTime + 2000)).toBe(true);
    });
  });
}); 