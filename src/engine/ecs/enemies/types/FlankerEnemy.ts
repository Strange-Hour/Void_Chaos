import { IEnemyTypeDefinition } from './IEnemyTypeDefinition';
import { MovementStateType, MovementPatternDefinition } from '@engine/ecs/ai/patterns/types';

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
    movementPatterns: {},
    initialPatternId: '',
  },
  movementStateMachine: {
    initial: 'flank' as MovementStateType,
    states: [
      { state: 'flank', pattern: { type: 'flank', targetType: 'player', flankWeight: 0.4, idealDistance: 100, distanceMargin: 50 } as MovementPatternDefinition },
      { state: 'search', pattern: { type: 'search', searchRadius: 160 } as MovementPatternDefinition },
      { state: 'chase', pattern: { type: 'chase', targetType: 'player' } as MovementPatternDefinition },
    ],
  },
  patrolRadius: 160,
}; 
