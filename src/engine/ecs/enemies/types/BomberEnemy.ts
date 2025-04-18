import { IEnemyTypeDefinition } from './IEnemyTypeDefinition';

export const BomberEnemy: IEnemyTypeDefinition = {
  id: 'bomber',
  name: 'Bomber Enemy',
  config: {
    speed: 120,
    health: 80,
    damage: 50,
    detectionRange: 300,
    attackRange: 100,
    scoreValue: 175,
  },
  behavior: {
    defaultState: 'chase',
    attackCooldown: 2000, // Longer cooldown due to high damage
  }
}; 