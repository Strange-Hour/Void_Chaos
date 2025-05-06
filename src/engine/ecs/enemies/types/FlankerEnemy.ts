import { IEnemyTypeDefinition } from './IEnemyTypeDefinition';
import { MovementStateType, MovementPatternDefinition } from '@engine/ecs/ai/patterns/types';
import { withinDetectionRange, withinAttackRange, outOfDetectionRange } from '@engine/ecs/ai/patterns/conditions/distance';
import { hasLineOfSightToPlayer, lacksLineOfSightToPlayer } from '@engine/ecs/ai/patterns/conditions/lineOfSight';
import { and, or } from '@engine/ecs/ai/patterns/conditions/combinators';

const idleToFlank = and(withinDetectionRange, hasLineOfSightToPlayer);
const idleToSearch = and(withinDetectionRange, lacksLineOfSightToPlayer);
const flankToSearch = or(outOfDetectionRange, lacksLineOfSightToPlayer);
const searchToIdle = and(withinDetectionRange, hasLineOfSightToPlayer);
const flankToChase = withinAttackRange;
const chaseToFlank = and(withinDetectionRange, hasLineOfSightToPlayer);

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
  },
  movementStateMachine: {
    initial: 'idle' as MovementStateType,
    states: [
      { state: 'idle', pattern: { type: 'idle' } as MovementPatternDefinition },
      { state: 'flank', pattern: { type: 'flank', targetType: 'player', flankWeight: 0.4, idealDistance: 100, distanceMargin: 50 } as MovementPatternDefinition },
      { state: 'search', pattern: { type: 'search', searchRadius: 160 } as MovementPatternDefinition },
      { state: 'chase', pattern: { type: 'chase', targetType: 'player' } as MovementPatternDefinition },
    ],
    transitions: [
      { from: 'idle', to: 'flank', condition: idleToFlank },
      { from: 'idle', to: 'search', condition: idleToSearch },
      { from: 'flank', to: 'search', condition: flankToSearch },
      { from: 'search', to: 'idle', condition: searchToIdle },
      { from: 'flank', to: 'chase', condition: flankToChase },
      { from: 'chase', to: 'flank', condition: chaseToFlank },
    ],
  },
  patrolRadius: 160,
}; 
