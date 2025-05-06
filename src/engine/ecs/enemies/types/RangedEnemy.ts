import { IEnemyTypeDefinition } from './IEnemyTypeDefinition';
import { MovementStateType, MovementPatternDefinition } from '@engine/ecs/ai/patterns/types';
import { withinDetectionRange, withinAttackRange, outOfDetectionRange } from '@engine/ecs/ai/patterns/conditions/distance';
import { hasLineOfSightToPlayer, lacksLineOfSightToPlayer } from '@engine/ecs/ai/patterns/conditions/lineOfSight';
import { and, or } from '@engine/ecs/ai/patterns/conditions/combinators';

const idleToRetreat = and(withinDetectionRange, hasLineOfSightToPlayer);
const idleToSearch = and(withinDetectionRange, lacksLineOfSightToPlayer);
const retreatToIdle = withinAttackRange;
const retreatToSearch = or(outOfDetectionRange, lacksLineOfSightToPlayer);
const searchToIdle = and(withinDetectionRange, hasLineOfSightToPlayer);

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
  },
  movementStateMachine: {
    initial: 'idle' as MovementStateType,
    states: [
      { state: 'idle', pattern: { type: 'idle' } as MovementPatternDefinition },
      { state: 'retreat', pattern: { type: 'retreat', targetType: 'player', idealDistance: 350, followThreshold: 500, distanceMargin: 100, minDistance: 200, maxDistance: 450, strafeEnabled: true } as MovementPatternDefinition },
      { state: 'search', pattern: { type: 'search', searchRadius: 192 } as MovementPatternDefinition },
    ],
    transitions: [
      { from: 'idle', to: 'retreat', condition: idleToRetreat },
      { from: 'idle', to: 'search', condition: idleToSearch },
      { from: 'retreat', to: 'idle', condition: retreatToIdle },
      { from: 'retreat', to: 'search', condition: retreatToSearch },
      { from: 'search', to: 'idle', condition: searchToIdle },
    ],
  },
  patrolRadius: 192,
}; 