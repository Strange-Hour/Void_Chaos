import { IEnemyTypeDefinition } from './IEnemyTypeDefinition';

export const BasicEnemy: IEnemyTypeDefinition = {
  id: 'basic',
  name: 'Basic Enemy',
  config: {
    speed: 150,
    health: 100,
    damage: 20,
    detectionRange: 400,
    attackRange: 50,
    scoreValue: 100,
  },
  behavior: {
    defaultState: 'chase',
    attackCooldown: 1000,
  }
}; 