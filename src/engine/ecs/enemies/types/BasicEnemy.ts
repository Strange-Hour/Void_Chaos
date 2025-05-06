import { IEnemyTypeDefinition } from './IEnemyTypeDefinition';
import { MovementStateType, MovementPatternDefinition } from '@engine/ecs/ai/patterns/types';
import { withinDetectionRange, withinAttackRange, outOfDetectionRange } from '@engine/ecs/ai/patterns/conditions/distance';
import { hasLineOfSightToPlayer, lacksLineOfSightToPlayer } from '@engine/ecs/ai/patterns/conditions/lineOfSight';
import { and, or } from '@engine/ecs/ai/patterns/conditions/combinators';

const idleToChase = and(withinDetectionRange, hasLineOfSightToPlayer);
const idleToSearch = and(withinDetectionRange, lacksLineOfSightToPlayer);
const chaseToSearch = or(outOfDetectionRange, lacksLineOfSightToPlayer);
const searchToIdle = and(withinDetectionRange, hasLineOfSightToPlayer);
const chaseToIdle = withinAttackRange;

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
    attackCooldown: 1000,
  },
  movementStateMachine: {
    initial: 'idle' as MovementStateType,
    states: [
      { state: 'idle', pattern: { type: 'idle' } as MovementPatternDefinition },
      { state: 'chase', pattern: { type: 'chase', targetType: 'player' } as MovementPatternDefinition },
      { state: 'search', pattern: { type: 'search', searchRadius: 128 } as MovementPatternDefinition },
    ],
    transitions: [
      { from: 'idle', to: 'chase', condition: idleToChase },
      { from: 'idle', to: 'search', condition: idleToSearch },
      { from: 'chase', to: 'search', condition: chaseToSearch },
      { from: 'search', to: 'idle', condition: searchToIdle },
      { from: 'chase', to: 'idle', condition: chaseToIdle },
    ],
  },
  patrolRadius: 128,
}; 