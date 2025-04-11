import { Health, HealthConfig } from './Health';

describe('Health', () => {
  let health: Health;
  const defaultConfig: HealthConfig = {
    maxHealth: 100
  };

  beforeEach(() => {
    health = new Health(defaultConfig);
  });

  it('should initialize with default values', () => {
    expect(health.getCurrentHealth()).toBe(defaultConfig.maxHealth);
    expect(health.getMaxHealth()).toBe(defaultConfig.maxHealth);
    expect(health.isInvulnerableState()).toBe(false);
    expect(health.getRegenerationRate()).toBe(0);
  });

  it('should initialize with custom values', () => {
    const customConfig: HealthConfig = {
      maxHealth: 200,
      currentHealth: 150,
      isInvulnerable: true,
      regenerationRate: 5
    };
    const customHealth = new Health(customConfig);
    expect(customHealth.getCurrentHealth()).toBe(customConfig.currentHealth);
    expect(customHealth.getMaxHealth()).toBe(customConfig.maxHealth);
    expect(customHealth.isInvulnerableState()).toBe(customConfig.isInvulnerable);
    expect(customHealth.getRegenerationRate()).toBe(customConfig.regenerationRate);
  });

  it('should return correct component type', () => {
    expect(health.getType()).toBe('health');
  });

  describe('health management', () => {
    it('should set max health and clamp current health', () => {
      health.damage(20); // Current health = 80
      health.setMaxHealth(70);
      expect(health.getMaxHealth()).toBe(70);
      expect(health.getCurrentHealth()).toBe(70);
    });

    it('should heal and return amount healed', () => {
      health.damage(50); // Current health = 50
      const healed = health.heal(30);
      expect(health.getCurrentHealth()).toBe(80);
      expect(healed).toBe(30);
    });

    it('should not heal above max health', () => {
      health.damage(20); // Current health = 80
      const healed = health.heal(30);
      expect(health.getCurrentHealth()).toBe(100);
      expect(healed).toBe(20);
    });

    it('should damage and return amount damaged', () => {
      const damaged = health.damage(30);
      expect(health.getCurrentHealth()).toBe(70);
      expect(damaged).toBe(30);
    });

    it('should not damage below 0', () => {
      const damaged = health.damage(120);
      expect(health.getCurrentHealth()).toBe(0);
      expect(damaged).toBe(100);
    });

    it('should not take damage when invulnerable', () => {
      health.setInvulnerable(true);
      const damaged = health.damage(30);
      expect(health.getCurrentHealth()).toBe(100);
      expect(damaged).toBe(0);
    });

    it('should detect death state', () => {
      expect(health.isDead()).toBe(false);
      health.damage(100);
      expect(health.isDead()).toBe(true);
    });
  });

  describe('regeneration', () => {
    it('should regenerate health over time', () => {
      health.damage(50); // Current health = 50
      health.setRegenerationRate(10);
      health.update(1); // 1 second
      expect(health.getCurrentHealth()).toBe(60);
    });

    it('should not regenerate above max health', () => {
      health.damage(20); // Current health = 80
      health.setRegenerationRate(30);
      health.update(1); // 1 second
      expect(health.getCurrentHealth()).toBe(100);
    });

    it('should not regenerate with rate of 0', () => {
      health.damage(50); // Current health = 50
      health.setRegenerationRate(0);
      health.update(1); // 1 second
      expect(health.getCurrentHealth()).toBe(50);
    });

    it('should scale regeneration with delta time', () => {
      health.damage(50); // Current health = 50
      health.setRegenerationRate(10);
      health.update(0.5); // 0.5 seconds
      expect(health.getCurrentHealth()).toBe(55);
    });
  });

  describe('serialization', () => {
    it('should serialize all properties', () => {
      health.damage(20);
      health.setInvulnerable(true);
      health.setRegenerationRate(5);

      const serialized = health.serialize() as {
        maxHealth: number;
        currentHealth: number;
        isInvulnerable: boolean;
        regenerationRate: number;
      };

      expect(serialized.maxHealth).toBe(100);
      expect(serialized.currentHealth).toBe(80);
      expect(serialized.isInvulnerable).toBe(true);
      expect(serialized.regenerationRate).toBe(5);
    });

    it('should deserialize all properties', () => {
      const data = {
        maxHealth: 200,
        currentHealth: 150,
        isInvulnerable: true,
        regenerationRate: 10
      };
      health.deserialize(data);
      expect(health.getMaxHealth()).toBe(200);
      expect(health.getCurrentHealth()).toBe(150);
      expect(health.isInvulnerableState()).toBe(true);
      expect(health.getRegenerationRate()).toBe(10);
    });

    it('should handle partial deserialization', () => {
      const data = {
        currentHealth: 80,
        isInvulnerable: true
      };
      health.deserialize(data);
      expect(health.getMaxHealth()).toBe(100);
      expect(health.getCurrentHealth()).toBe(80);
      expect(health.isInvulnerableState()).toBe(true);
      expect(health.getRegenerationRate()).toBe(0);
    });

    it('should clamp deserialized current health to max health', () => {
      const data = {
        maxHealth: 50,
        currentHealth: 100
      };
      health.deserialize(data);
      expect(health.getMaxHealth()).toBe(50);
      expect(health.getCurrentHealth()).toBe(50);
    });
  });
}); 