/**
 * IdlePattern implements a movement strategy where the AI does not move at all.
 * Useful for search, waiting, or stunned states.
 * Ignores pathfinding context.
 */
import { IMovementPattern, MovementPatternContext } from './types';
import { Entity } from '@engine/ecs/Entity';
import { Vector2 } from '@engine/math/Vector2';

export class IdlePattern implements IMovementPattern {
  /**
   * Always returns a zero vector, indicating no movement. Ignores pathfinding context.
   * @param entity The AI-controlled entity
   * @param target The target entity (unused)
   * @param _context Additional context (unused)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getMoveDirection(entity: Entity, target: Entity, _context: MovementPatternContext): Vector2 {
    return { x: 0, y: 0 };
  }
} 