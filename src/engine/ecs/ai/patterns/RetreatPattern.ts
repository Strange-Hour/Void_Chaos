/**
 * RetreatPattern implements a movement strategy where the AI tries to maintain a certain distance
 * from the target. If too close, it retreats; if too far, it approaches; if within margin, it strafes.
 * Useful for ranged or cautious enemies.
 * Now uses A* pathfinding via the nextWaypoint provided in context for obstacle avoidance.
 */
import { IMovementPattern, MovementPatternContext } from './types';
import { Entity } from '@engine/ecs/Entity';
import { Vector2 } from '@engine/math/Vector2';
import { Transform } from '@engine/ecs/components/Transform';
import { getRetreatPatternParams, moveToGoal, getRetreatGoal, getApproachGoal, getStrafeGoal } from '@engine/ecs/ai/patterns/utils/retreatPatternParams';
import { getDistanceToTarget } from '@engine/ecs/ai/patterns/utils/getDistanceToTarget';

export class RetreatPattern implements IMovementPattern {
  /**
   * Returns a normalized direction vector toward the optimal retreat/approach/strafe cell using pathfinding,
   * or computes fallback direction if no path is available.
   * @param entity The AI-controlled entity
   * @param target The target entity (e.g., player)
   * @param context Includes grid for pathfinding
   */
  getMoveDirection(entity: Entity, target: Entity, context: MovementPatternContext): Vector2 {
    const pos = (entity.getComponent('transform') as Transform)?.getPosition();
    const targetPos = (target.getComponent('transform') as Transform)?.getPosition();
    if (!pos || !targetPos) return { x: 0, y: 0 };
    const grid = context.grid;
    const params = getRetreatPatternParams(entity);
    const dist = getDistanceToTarget(pos, targetPos);
    const dx = targetPos.x - pos.x;
    const dy = targetPos.y - pos.y;
    const toTarget = { x: dx / (dist || 1), y: dy / (dist || 1) };

    // Zones
    if (dist < params.minDistance) {
      // Always retreat if too close
      return moveToGoal(pos, getRetreatGoal(pos, toTarget, grid, targetPos), grid, context);
    } else if (dist > (params.maxDistance ?? params.followThreshold)) {
      // Approach if too far
      return moveToGoal(pos, getApproachGoal(pos, toTarget, grid), grid, context);
    } else if (params.strafeEnabled && dist >= params.minDistance && dist <= params.maxDistance) {
      // Strafe if enabled and in ideal zone
      const strafeGoal = getStrafeGoal(pos, toTarget, grid);
      const strafeDir = moveToGoal(pos, strafeGoal, grid, context);
      if (strafeDir.x !== 0 || strafeDir.y !== 0) return strafeDir;
      // Fallback to retreat if strafe blocked
      return moveToGoal(pos, getRetreatGoal(pos, toTarget, grid, targetPos), grid, context);
    }
    // Idle if in perfect spot and strafe not enabled
    return { x: 0, y: 0 };
  }
}