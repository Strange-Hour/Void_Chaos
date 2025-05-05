import { IEnemyTypeDefinition } from './IEnemyTypeDefinition';

export const FlankerEnemy: IEnemyTypeDefinition = {
  id: 'flanker',
  name: 'Flanker Enemy',
  color: '#ec4899',
  config: {
    speed: 200,
    health: 75,
    damage: 15,
    detectionRange: 500,
    attackRange: 40,
    scoreValue: 150,
  },
  behavior: {
    attackCooldown: 1000,

    movementPatterns: {
      'flank': { type: 'flank', targetType: 'player', flankWeight: 0.4, idealDistance: 100, distanceMargin: 50 },
      'chase': { type: 'chase', targetType: 'player' }
    },

    initialPatternId: 'flank',
  }
}; 
