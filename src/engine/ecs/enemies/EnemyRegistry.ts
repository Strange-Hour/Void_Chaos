import { IEnemyTypeDefinition } from './types/IEnemyTypeDefinition';
import { BasicEnemy } from './types/BasicEnemy';
import { FlankerEnemy } from './types/FlankerEnemy';
import { RangedEnemy } from './types/RangedEnemy';
import { BomberEnemy } from './types/BomberEnemy';

export class EnemyRegistry {
  private static instance: EnemyRegistry;
  private enemyTypes: Map<string, IEnemyTypeDefinition> = new Map();

  private constructor() {
    // Register default enemy types
    this.registerEnemyType(BasicEnemy);
    this.registerEnemyType(FlankerEnemy);
    this.registerEnemyType(RangedEnemy);
    this.registerEnemyType(BomberEnemy);
  }

  static getInstance(): EnemyRegistry {
    if (!EnemyRegistry.instance) {
      EnemyRegistry.instance = new EnemyRegistry();
    }
    return EnemyRegistry.instance;
  }

  registerEnemyType(enemyType: IEnemyTypeDefinition): void {
    if (this.enemyTypes.has(enemyType.id)) {
      console.warn(`Enemy type with id '${enemyType.id}' is already registered. Overwriting...`);
    }
    this.enemyTypes.set(enemyType.id, enemyType);
  }

  getEnemyType(id: string): IEnemyTypeDefinition | undefined {
    return this.enemyTypes.get(id);
  }

  getAllEnemyTypes(): IEnemyTypeDefinition[] {
    return Array.from(this.enemyTypes.values());
  }
} 