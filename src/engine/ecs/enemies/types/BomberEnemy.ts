import { IEnemyTypeDefinition } from './IEnemyTypeDefinition';
import { MovementStateType, MovementPatternDefinition } from '@engine/ecs/ai/patterns/types';

export const BomberEnemy: IEnemyTypeDefinition = {
  id: 'bomber',
  name: 'Bomber Enemy',
  color: '#f97316',
  config: {
    speed: 120,
    health: 80,
    damage: 50,
    detectionRange: 300,
    attackRange: 100,
    scoreValue: 175,
  },
  behavior: {
    attackCooldown: 2000, // Longer cooldown due to high damage
    movementPatterns: {},
    initialPatternId: '',
  },
  movementStateMachine: {
    initial: 'chase' as MovementStateType,
    states: [
      { state: 'chase', pattern: { type: 'chase', targetType: 'player' } as MovementPatternDefinition },
      { state: 'search', pattern: { type: 'search', searchRadius: 96 } as MovementPatternDefinition },
      { state: 'idle', pattern: { type: 'idle' } as MovementPatternDefinition },
    ],
  },
  patrolRadius: 96,
}; 