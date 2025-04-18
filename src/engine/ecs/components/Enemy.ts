import { Component } from '../Entity';
import { IEnemyTypeDefinition } from '../enemies/types/IEnemyTypeDefinition';
import { EnemyRegistry } from '../enemies/EnemyRegistry';

export class Enemy extends Component {
  private typeDefinition: IEnemyTypeDefinition;
  private currentHealth: number;
  private lastAttackTime: number;

  constructor(typeId: string) {
    super();
    const registry = EnemyRegistry.getInstance();
    const enemyType = registry.getEnemyType(typeId);
    if (!enemyType) {
      throw new Error(`Enemy type '${typeId}' not found in registry`);
    }
    this.typeDefinition = enemyType;
    this.currentHealth = enemyType.config.health;
    this.lastAttackTime = 0;
  }

  getType(): string {
    return 'enemy';
  }

  getEnemyTypeId(): string {
    return this.typeDefinition.id;
  }

  getConfig(): Readonly<IEnemyTypeDefinition['config']> {
    return { ...this.typeDefinition.config };
  }

  getCurrentHealth(): number {
    return this.currentHealth;
  }

  takeDamage(amount: number): void {
    this.currentHealth = Math.max(0, this.currentHealth - amount);
  }

  heal(amount: number): void {
    this.currentHealth = Math.min(this.typeDefinition.config.health, this.currentHealth + amount);
  }

  isAlive(): boolean {
    return this.currentHealth > 0;
  }

  canAttack(currentTime: number): boolean {
    return currentTime - this.lastAttackTime >= this.typeDefinition.behavior.attackCooldown;
  }

  attack(currentTime: number): number {
    if (!this.canAttack(currentTime)) return 0;

    this.lastAttackTime = currentTime;
    return this.typeDefinition.config.damage;
  }

  getDefaultState(): string {
    return this.typeDefinition.behavior.defaultState;
  }

  getScoreValue(): number {
    return this.typeDefinition.config.scoreValue;
  }

  serialize(): object {
    return {
      typeId: this.typeDefinition.id,
      currentHealth: this.currentHealth,
      lastAttackTime: this.lastAttackTime,
    };
  }

  deserialize(data: {
    typeId?: string;
    currentHealth?: number;
    lastAttackTime?: number;
  }): void {
    if (data.typeId) {
      const registry = EnemyRegistry.getInstance();
      const enemyType = registry.getEnemyType(data.typeId);
      if (!enemyType) {
        throw new Error(`Enemy type '${data.typeId}' not found in registry during deserialization`);
      }
      this.typeDefinition = enemyType;
    }
    if (typeof data.currentHealth === 'number') {
      this.currentHealth = data.currentHealth;
    }
    if (typeof data.lastAttackTime === 'number') {
      this.lastAttackTime = data.lastAttackTime;
    }
  }
} 