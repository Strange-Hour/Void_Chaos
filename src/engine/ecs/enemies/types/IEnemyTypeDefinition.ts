import { MovementPatternDefinition } from '@engine/ecs/ai/patterns/types';

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

    /**
     * A record mapping unique string IDs to the movement pattern definitions
     * available for this enemy type.
     */
    movementPatterns: Record<string, MovementPatternDefinition>;

    /**
     * The ID of the movement pattern this enemy should start with.
     * Must be a key in the `movementPatterns` object.
     */
    initialPatternId: string;
  };
} 