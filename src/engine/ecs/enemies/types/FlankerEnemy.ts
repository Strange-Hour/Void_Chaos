import { IEnemyTypeDefinition } from './IEnemyTypeDefinition';

export const FlankerEnemy: IEnemyTypeDefinition = {
  id: 'flanker',
  name: 'Flanker Enemy',
  config: {
    speed: 200,
    health: 75,
    damage: 15,
    detectionRange: 500,
    attackRange: 40,
    scoreValue: 150,
  },
  behavior: {
    defaultState: 'chase',
    attackCooldown: 1000,
  }
}; 
