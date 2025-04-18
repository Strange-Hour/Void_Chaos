import { IEnemyTypeDefinition } from './IEnemyTypeDefinition';

export const RangedEnemy: IEnemyTypeDefinition = {
  id: 'ranged',
  name: 'Ranged Enemy',
  config: {
    speed: 100,
    health: 50,
    damage: 10,
    detectionRange: 600,
    attackRange: 400,
    scoreValue: 200,
  },
  behavior: {
    defaultState: 'retreat',
    attackCooldown: 1000,
  }
}; 