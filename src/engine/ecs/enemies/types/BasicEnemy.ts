import { IEnemyTypeDefinition } from './IEnemyTypeDefinition';
import { MovementStateType, MovementPatternDefinition } from '@engine/ecs/ai/patterns/types';
// Import specific pattern types if needed for casting or stricter typing
// import { IChasePattern, IIdlePattern } from '@engine/ecs/ai/patterns/types';

export const BasicEnemy: IEnemyTypeDefinition = {
  id: 'basic',
  name: 'Basic Enemy',
  color: '#ef4444',
  config: {
    speed: 150,
    health: 100,
    damage: 20,
    detectionRange: 400,
    attackRange: 50,
    scoreValue: 100,
  },
  behavior: {
    // Remove old defaultState
    // defaultState: 'chase',
    attackCooldown: 1000,
    movementPatterns: {},
    initialPatternId: '',
  },
  movementStateMachine: {
    initial: 'chase' as MovementStateType,
    states: [
      { state: 'chase', pattern: { type: 'chase', targetType: 'player' } as MovementPatternDefinition },
      { state: 'search', pattern: { type: 'search', searchRadius: 128 } as MovementPatternDefinition },
      { state: 'idle', pattern: { type: 'idle' } as MovementPatternDefinition },
    ],
  },
  patrolRadius: 128,
}; 