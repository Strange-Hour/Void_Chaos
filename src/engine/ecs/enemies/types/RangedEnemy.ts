import { IEnemyTypeDefinition } from './IEnemyTypeDefinition';
import { MovementStateType, MovementPatternDefinition } from '@engine/ecs/ai/patterns/types';

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
    movementPatterns: {},
    initialPatternId: '',
  },
  movementStateMachine: {
    initial: 'retreat' as MovementStateType,
    states: [
      { state: 'retreat', pattern: { type: 'retreat', targetType: 'player', idealDistance: 350, followThreshold: 500, distanceMargin: 100 } as MovementPatternDefinition },
      { state: 'search', pattern: { type: 'search', searchRadius: 192 } as MovementPatternDefinition },
      { state: 'idle', pattern: { type: 'idle' } as MovementPatternDefinition },
    ],
  },
  patrolRadius: 192,
}; 