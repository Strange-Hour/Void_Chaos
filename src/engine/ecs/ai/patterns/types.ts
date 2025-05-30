/**
 * Movement Pattern System Types
 *
 * This module defines the types and interfaces for the extensible AI movement pattern system.
 * Each movement pattern (e.g., chase, retreat, flank, idle) is implemented as a class conforming to IMovementPattern.
 * Enemies use a state machine to switch between movement states, each associated with a pattern and transition logic.
 *
 * To add a new pattern, implement IMovementPattern and register it in the pattern registry.
 * To add a new state, update the enemy's movementStateMachine definition and (optionally) transition logic in the AI system.
 */
import { Entity } from '@engine/ecs/Entity';
import { Vector2 } from '@engine/math/Vector2';
import { Grid } from '@engine/ecs/pathfinding/Grid';
import { AI } from '@engine/ecs/components/AI';

/**
 * Base interface for all movement pattern definitions.
 */
export interface IMovementPatternDefinition {
  /**
   * The type of movement pattern (e.g., 'chase', 'retreat').
   * Used to determine which logic to apply in the AI system.
   */
  type: 'chase' | 'retreat' | 'flank' | 'idle' | 'search';
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
  /**
   * Optional minimum distance to always maintain from the target (overrides margin if set).
   */
  minDistance?: number;
  /**
   * Optional maximum distance to maintain from the target (overrides margin if set).
   */
  maxDistance?: number;
  /**
   * Whether strafing is enabled when within the ideal distance band.
   */
  strafeEnabled?: boolean;
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
 * Definition for a 'search' movement pattern.
 * Wanders within a radius of the last known player position.
 */
export interface ISearchPattern extends IMovementPatternDefinition {
  type: 'search';
  /**
   * The radius (in world units) to search around the last known player position.
   * If not provided, will use the enemy's patrolRadius or detectionRange.
   */
  searchRadius?: number;
  /**
   * How long (ms) to search before giving up (optional).
   */
  searchTimeoutMs?: number;
}

/**
 * Union type for all possible movement pattern definitions.
 */
export type MovementPatternDefinition =
  | IChasePattern
  | IRetreatPattern
  | IFlankPattern
  | IIdlePattern
  | ISearchPattern;

/**
 * The type of movement state for an enemy (e.g., chase, search, retreat, etc.)
 */
export type MovementStateType = 'chase' | 'search' | 'retreat' | 'flank' | 'idle';

/**
 * Associates a movement state with a movement pattern definition.
 */
export interface MovementStateDefinition {
  state: MovementStateType;
  pattern: MovementPatternDefinition;
}

/**
 * Transition definition for state machines.
 * - from: source state
 * - to: target state
 * - condition: function that determines if the transition should occur
 */
export interface MovementStateTransition {
  from: MovementStateType;
  to: MovementStateType;
  /**
   * Condition function to determine if transition should occur.
   * Receives the entity, AI, target, and context.
   */
  condition: (params: {
    entity: Entity;
    ai: AI;
    target: Entity | null;
    context: MovementPatternContext;
    stateData: Record<string, unknown>;
  }) => boolean;
}

/**
 * State machine definition for enemy movement (with transitions).
 * - initial: the starting state
 * - states: all available states and their patterns
 * - transitions: all possible transitions and their conditions
 */
export interface EnemyMovementStateMachine {
  initial: MovementStateType;
  states: MovementStateDefinition[];
  transitions: MovementStateTransition[];
}

/**
 * Runtime interface for a movement state machine instance.
 * Holds current state, evaluates transitions, and exposes current pattern.
 */
export interface IStateMachine {
  getCurrentState(): MovementStateType;
  getCurrentPattern(): MovementPatternDefinition;
  update(params: {
    entity: Entity;
    ai: AI;
    target: Entity | null;
    context: MovementPatternContext;
  }): void;
  // Optionally, expose state data for debugging
  getStateData(): Record<string, unknown>;
}

/**
 * Runtime interface for a movement pattern implementation.
 * Each pattern class must implement this interface.
 */
export interface IMovementPattern {
  /**
   * Calculate the next movement direction for an entity.
   * @param entity The enemy entity
   * @param target The target entity (e.g., player)
   * @param context Additional context (e.g., grid, world, etc.)
   * @returns A normalized Vector2 direction
   */
  getMoveDirection(
    entity: Entity,
    target: Entity,
    context: MovementPatternContext
  ): Vector2;
}

/**
 * Context object passed to movement patterns for additional information (e.g., grid, world, etc.).
 */
export interface MovementPatternContext {
  grid: Grid;
  // Optional: expose the computed path for debug visualization
  debugPath?: Vector2[];
  // Optional: state machine data for stateful patterns
  stateData?: Record<string, unknown>;
} 