import { Component } from '../Entity';

export interface HealthConfig {
  maxHealth: number;
  currentHealth?: number;
  isInvulnerable?: boolean;
  regenerationRate?: number;
}

/**
 * Health component for managing entity health and damage
 */
export class Health extends Component {
  private maxHealth: number;
  private currentHealth: number;
  private isInvulnerable: boolean;
  private regenerationRate: number;

  constructor(config: HealthConfig) {
    super();
    this.maxHealth = config.maxHealth;
    this.currentHealth = config.currentHealth ?? this.maxHealth;
    this.isInvulnerable = config.isInvulnerable ?? false;
    this.regenerationRate = config.regenerationRate ?? 0;
  }

  getType(): string {
    return 'health';
  }

  getCurrentHealth(): number {
    return this.currentHealth;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  setMaxHealth(maxHealth: number): void {
    this.maxHealth = maxHealth;
    this.currentHealth = Math.min(this.currentHealth, maxHealth);
  }

  heal(amount: number): number {
    const oldHealth = this.currentHealth;
    this.currentHealth = Math.min(this.currentHealth + amount, this.maxHealth);
    return this.currentHealth - oldHealth;
  }

  damage(amount: number): number {
    if (this.isInvulnerable) return 0;

    const oldHealth = this.currentHealth;
    this.currentHealth = Math.max(this.currentHealth - amount, 0);
    return oldHealth - this.currentHealth;
  }

  isDead(): boolean {
    return this.currentHealth <= 0;
  }

  setInvulnerable(isInvulnerable: boolean): void {
    this.isInvulnerable = isInvulnerable;
  }

  isInvulnerableState(): boolean {
    return this.isInvulnerable;
  }

  getRegenerationRate(): number {
    return this.regenerationRate;
  }

  setRegenerationRate(rate: number): void {
    this.regenerationRate = rate;
  }

  /**
   * Update health regeneration
   * @param deltaTime Time elapsed since last update in seconds
   */
  update(deltaTime: number): void {
    if (this.regenerationRate > 0 && this.currentHealth < this.maxHealth) {
      this.heal(this.regenerationRate * deltaTime);
    }
  }

  serialize(): object {
    return {
      maxHealth: this.maxHealth,
      currentHealth: this.currentHealth,
      isInvulnerable: this.isInvulnerable,
      regenerationRate: this.regenerationRate
    };
  }

  deserialize(data: {
    maxHealth?: number;
    currentHealth?: number;
    isInvulnerable?: boolean;
    regenerationRate?: number;
  }): void {
    if (typeof data.maxHealth === 'number') {
      this.maxHealth = data.maxHealth;
    }
    if (typeof data.currentHealth === 'number') {
      this.currentHealth = Math.min(data.currentHealth, this.maxHealth);
    }
    if (typeof data.isInvulnerable === 'boolean') {
      this.isInvulnerable = data.isInvulnerable;
    }
    if (typeof data.regenerationRate === 'number') {
      this.regenerationRate = data.regenerationRate;
    }
  }
} 