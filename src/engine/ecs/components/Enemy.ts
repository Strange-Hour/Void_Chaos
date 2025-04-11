import { Component } from '../Entity';

export enum EnemyType {
  Basic = 'basic',     // Simple chase behavior
  Flanker = 'flanker', // Tries to flank the player
  Ranged = 'ranged',   // Keeps distance and shoots
}

export interface EnemyConfig {
  type: EnemyType;
  speed: number;
  health: number;
  damage: number;
  detectionRange: number;
  attackRange: number;
  scoreValue: number;
}

const DEFAULT_CONFIGS: Record<EnemyType, EnemyConfig> = {
  [EnemyType.Basic]: {
    type: EnemyType.Basic,
    speed: 150,
    health: 100,
    damage: 20,
    detectionRange: 400,
    attackRange: 50,
    scoreValue: 100,
  },
  [EnemyType.Flanker]: {
    type: EnemyType.Flanker,
    speed: 200,
    health: 75,
    damage: 15,
    detectionRange: 500,
    attackRange: 40,
    scoreValue: 150,
  },
  [EnemyType.Ranged]: {
    type: EnemyType.Ranged,
    speed: 100,
    health: 50,
    damage: 10,
    detectionRange: 600,
    attackRange: 400,
    scoreValue: 200,
  },
};

/**
 * Component that defines enemy-specific properties and behavior configuration
 */
export class Enemy extends Component {
  private config: EnemyConfig;
  private currentHealth: number;
  private lastAttackTime: number;
  private attackCooldown: number;

  constructor(type: EnemyType = EnemyType.Basic) {
    super();
    this.config = { ...DEFAULT_CONFIGS[type] };
    this.currentHealth = this.config.health;
    this.lastAttackTime = 0;
    this.attackCooldown = 1000; // 1 second cooldown between attacks
  }

  getType(): string {
    return 'enemy';
  }

  getEnemyType(): EnemyType {
    return this.config.type;
  }

  getConfig(): Readonly<EnemyConfig> {
    return { ...this.config };
  }

  setConfig(config: EnemyConfig): void {
    this.config = { ...config };
    // Update current health to match new max health if it was higher
    if (this.currentHealth > this.config.health) {
      this.currentHealth = this.config.health;
    }
  }

  getCurrentHealth(): number {
    return this.currentHealth;
  }

  takeDamage(amount: number): void {
    this.currentHealth = Math.max(0, this.currentHealth - amount);
  }

  heal(amount: number): void {
    this.currentHealth = Math.min(this.config.health, this.currentHealth + amount);
  }

  isAlive(): boolean {
    return this.currentHealth > 0;
  }

  canAttack(currentTime: number): boolean {
    return currentTime - this.lastAttackTime >= this.attackCooldown;
  }

  attack(currentTime: number): number {
    if (!this.canAttack(currentTime)) return 0;

    this.lastAttackTime = currentTime;
    return this.config.damage;
  }

  setAttackCooldown(cooldown: number): void {
    this.attackCooldown = cooldown;
  }

  getScoreValue(): number {
    return this.config.scoreValue;
  }

  serialize(): object {
    return {
      config: this.config,
      currentHealth: this.currentHealth,
      lastAttackTime: this.lastAttackTime,
      attackCooldown: this.attackCooldown,
    };
  }

  deserialize(data: {
    config?: EnemyConfig;
    currentHealth?: number;
    lastAttackTime?: number;
    attackCooldown?: number;
  }): void {
    if (data.config) {
      this.config = { ...data.config };
    }
    if (typeof data.currentHealth === 'number') {
      this.currentHealth = data.currentHealth;
    }
    if (typeof data.lastAttackTime === 'number') {
      this.lastAttackTime = data.lastAttackTime;
    }
    if (typeof data.attackCooldown === 'number') {
      this.attackCooldown = data.attackCooldown;
    }
  }
} 