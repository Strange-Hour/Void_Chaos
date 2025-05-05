import { IEnemyTypeDefinition } from './IEnemyTypeDefinition';

export const RangedEnemy: IEnemyTypeDefinition = {
  id: 'ranged',
  name: 'Ranged Enemy',
  color: '#eab308',
  config: {
    speed: 100,
    health: 50,
    damage: 10,
    detectionRange: 600,
    attackRange: 400,
    scoreValue: 200,
  },
  behavior: {
    attackCooldown: 1000,

    movementPatterns: {
      'keep_distance': { type: 'retreat', targetType: 'player', idealDistance: 350, followThreshold: 500, distanceMargin: 100 },
      'flee': { type: 'retreat', targetType: 'player', idealDistance: 450, followThreshold: 600, distanceMargin: 50 },
      'idle': { type: 'idle' }
    },

    initialPatternId: 'keep_distance',
  }
}; 