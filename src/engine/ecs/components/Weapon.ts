import { Component } from '@engine/ecs/Entity';
import { Vector2 } from '@engine/math/Vector2';

export interface ProjectileConfig {
  speed: number;
  size: number;
  damage: number;
  lifetime: number;
}

/**
 * Component that represents a weapon that can be fired
 */
export class Weapon extends Component {
  private damage: number;
  private range: number;
  private cooldown: number;
  private lastFireTime: number;
  private projectileConfig: ProjectileConfig | null;
  private automatic: boolean;
  private firing: boolean;
  private _lastFiringDirection: Vector2;

  constructor(
    damage: number = 10,
    range: number = 100,
    cooldown: number = 1000,
    projectileConfig: ProjectileConfig | null = null,
    automatic: boolean = false
  ) {
    super();
    this.damage = damage;
    this.range = range;
    this.cooldown = cooldown;
    this.lastFireTime = 0;
    this.projectileConfig = projectileConfig;
    this.automatic = automatic;
    this.firing = false;
    this._lastFiringDirection = { x: 1, y: 0 };
  }

  getType(): string {
    return 'weapon';
  }

  /**
   * Get the weapon's damage value
   */
  getDamage(): number {
    return this.damage;
  }

  /**
   * Set the weapon's damage value
   */
  setDamage(damage: number): void {
    this.damage = damage;
  }

  /**
   * Get the weapon's range
   */
  getRange(): number {
    return this.range;
  }

  /**
   * Set the weapon's range
   */
  setRange(range: number): void {
    this.range = range;
  }

  /**
   * Get the weapon's cooldown period
   */
  getCooldown(): number {
    return this.cooldown;
  }

  /**
   * Set the weapon's cooldown period
   */
  setCooldown(cooldown: number): void {
    this.cooldown = cooldown;
  }

  /**
   * Check if the weapon can fire
   */
  canFire(currentTime: number): boolean {
    return currentTime - this.lastFireTime >= this.cooldown;
  }

  /**
   * Start firing the weapon (for automatic weapons)
   */
  startFiring(): void {
    this.firing = true;
  }

  /**
   * Stop firing the weapon
   */
  stopFiring(): void {
    this.firing = false;
  }

  /**
   * Check if weapon is currently firing
   */
  isFiring(): boolean {
    return this.firing;
  }

  /**
   * Check if weapon is automatic
   */
  isAutomatic(): boolean {
    return this.automatic;
  }

  /**
   * Get the last firing direction
   */
  getLastFiringDirection(): Vector2 {
    return { ...this._lastFiringDirection };
  }

  /**
   * Get the weapon's projectile configuration
   */
  getProjectileConfig(): ProjectileConfig | null {
    return this.projectileConfig ? { ...this.projectileConfig } : null;
  }

  /**
   * Set the weapon's projectile configuration
   */
  setProjectileConfig(config: ProjectileConfig | null): void {
    this.projectileConfig = config ? { ...config } : null;
  }

  /**
   * Fire the weapon
   */
  fire(currentTime: number, direction: Vector2): boolean {
    if (!this.canFire(currentTime)) {
      return false;
    }

    this._lastFiringDirection = { ...direction };
    this.lastFireTime = currentTime;
    return true;
  }

  /**
   * Update the weapon state
   */
  update(deltaTime: number, currentTime: number, direction: Vector2): void {
    if (this.automatic && this.firing) {
      this.fire(currentTime, direction);
    }
  }

  serialize(): object {
    return {
      damage: this.damage,
      range: this.range,
      cooldown: this.cooldown,
      lastFireTime: this.lastFireTime,
      projectileConfig: this.projectileConfig,
      automatic: this.automatic,
      firing: this.firing,
      lastFiringDirection: { ...this._lastFiringDirection }
    };
  }

  deserialize(data: {
    damage: number;
    range: number;
    cooldown: number;
    lastFireTime: number;
    projectileConfig: ProjectileConfig | null;
    automatic: boolean;
    firing: boolean;
    lastFiringDirection: Vector2;
  }): void {
    this.damage = data.damage;
    this.range = data.range;
    this.cooldown = data.cooldown;
    this.lastFireTime = data.lastFireTime;
    this.projectileConfig = data.projectileConfig;
    this.automatic = data.automatic;
    this.firing = data.firing;
    this._lastFiringDirection = { ...data.lastFiringDirection };
  }
} 