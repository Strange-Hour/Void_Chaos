import { EnemyMovementStateMachine } from '@engine/ecs/ai/patterns/types';

export interface IEnemyTypeDefinition {
  id: string;
  name: string;
  color: string;
  config: {
    speed: number;
    health: number;
    damage: number;
    detectionRange: number;
    attackRange: number;
    scoreValue: number;
  };
  behavior: {
    attackCooldown: number;
    // Add any behavior-specific properties here
  };
  /**
   * Optional patrol/search radius (in world units, e.g. pixels) for AI searching behavior.
   * If set, the enemy will only wander within this distance of the last known player position when searching.
   */
  patrolRadius?: number;
  movementStateMachine: EnemyMovementStateMachine;
} 