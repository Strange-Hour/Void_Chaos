import { Weapon, ProjectileConfig } from './Weapon';

describe('Weapon', () => {
  let weapon: Weapon;
  let projectileConfig: ProjectileConfig;

  beforeEach(() => {
    projectileConfig = {
      speed: 500,
      size: 10,
      damage: 20,
      lifetime: 2000
    };
    weapon = new Weapon(10, 100, 1000, projectileConfig, false);
  });

  describe('basic functionality', () => {
    it('should initialize with correct values', () => {
      expect(weapon.getDamage()).toBe(10);
      expect(weapon.getRange()).toBe(100);
      expect(weapon.getCooldown()).toBe(1000);
      expect(weapon.getProjectileConfig()).toEqual(projectileConfig);
      expect(weapon.isFiring()).toBe(false);
    });

    it('should handle firing cooldown correctly', () => {
      const currentTime = 2000;
      expect(weapon.canFire(currentTime)).toBe(true);
      expect(weapon.fire(currentTime, { x: 1, y: 0 })).toBe(true);

      const secondTime = 1500; // Only 500ms elapsed
      expect(weapon.canFire(secondTime)).toBe(false);
      expect(weapon.fire(secondTime, { x: 1, y: 0 })).toBe(false);
    });

    it('should handle automatic firing', () => {
      const autoWeapon = new Weapon(10, 100, 1000, null, true);
      autoWeapon.startFiring();
      expect(autoWeapon.isFiring()).toBe(true);

      const time = 2000;
      autoWeapon.update(16, time, { x: 1, y: 0 });
      expect(autoWeapon.getLastFiringDirection()).toEqual({ x: 1, y: 0 });

      autoWeapon.stopFiring();
      expect(autoWeapon.isFiring()).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should serialize correctly', () => {
      const time = 2000;
      weapon.fire(time, { x: 1, y: 0 });

      const serialized = weapon.serialize();
      expect(serialized).toEqual({
        damage: 10,
        range: 100,
        cooldown: 1000,
        lastFireTime: time,
        projectileConfig,
        automatic: false,
        firing: false,
        lastFiringDirection: { x: 1, y: 0 }
      });
    });

    it('should deserialize correctly', () => {
      const data = {
        damage: 20,
        range: 200,
        cooldown: 500,
        lastFireTime: 1500,
        projectileConfig: {
          speed: 600,
          size: 15,
          damage: 25,
          lifetime: 3000
        },
        automatic: true,
        firing: true,
        lastFiringDirection: { x: 0, y: 1 }
      };

      weapon.deserialize(data);

      expect(weapon.getDamage()).toBe(20);
      expect(weapon.getRange()).toBe(200);
      expect(weapon.getCooldown()).toBe(500);
      expect(weapon.getProjectileConfig()).toEqual(data.projectileConfig);
      expect(weapon.isAutomatic()).toBe(true);
      expect(weapon.isFiring()).toBe(true);
      expect(weapon.getLastFiringDirection()).toEqual({ x: 0, y: 1 });
    });
  });
}); 