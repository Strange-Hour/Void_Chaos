/**
 * Base interface for all movement pattern definitions.
 */
export interface IMovementPatternDefinition {
  /**
   * The type of movement pattern (e.g., 'chase', 'retreat').
   * Used to determine which logic to apply in the AI system.
   */
  type: 'chase' | 'retreat' | 'flank' | 'idle';
  /**
   * The type of entity this pattern should target (e.g., 'player').
   * Can be extended later for other target types (e.g., 'structure', 'other_enemy').
   */
  targetType?: 'player'; // Optional for patterns like 'idle'
}

/**
 * Definition for a 'chase' movement pattern.
 * Moves directly towards the target.
 */
export interface IChasePattern extends IMovementPatternDefinition {
  type: 'chase';
  targetType: 'player';
  // Future potential parameters:
  // stopDistance?: number; // Distance at which to stop chasing
}

/**
 * Definition for a 'retreat' movement pattern.
 * Maintains a specific distance from the target.
 */
export interface IRetreatPattern extends IMovementPatternDefinition {
  type: 'retreat';
  targetType: 'player';
  /**
   * The ideal distance to maintain from the target (in pixels).
   */
  idealDistance: number;
  /**
   * If the target is further than this threshold (in pixels), the entity will move towards it.
   * This prevents the entity from retreating indefinitely if the target stops moving.
   */
  followThreshold: number;
  /**
   * Optional margin around the ideal distance. If within idealDistance +/- margin,
   * the entity might perform other actions like strafing (handled by AI system).
   * If not provided, AI system might use a default or simpler logic.
   */
  distanceMargin?: number;
}

/**
 * Definition for a 'flank' movement pattern.
 * Attempts to move around the target while staying within a certain range.
 */
export interface IFlankPattern extends IMovementPatternDefinition {
  type: 'flank';
  targetType: 'player';
  /**
   * Weight determining how much to prioritize flanking vs. direct approach (0-1).
   * 0 = Direct approach (like chase)
   * 1 = Pure perpendicular movement
   * Default could be 0.3 as in the original system.
   */
  flankWeight?: number;
  /**
   * Ideal distance to maintain while flanking.
   */
  idealDistance?: number;
  /**
   * Margin for the ideal distance.
   */
  distanceMargin?: number;
}

/**
 * Definition for an 'idle' movement pattern.
 * The entity does not attempt to move based on a target.
 */
export interface IIdlePattern extends IMovementPatternDefinition {
  type: 'idle';
  targetType?: never; // Idle doesn't need a target
}

/**
 * Union type for all possible movement pattern definitions.
 */
export type MovementPatternDefinition =
  | IChasePattern
  | IRetreatPattern
  | IFlankPattern
  | IIdlePattern; 