/**
 * RetreatPattern implements a movement strategy where the AI tries to maintain a certain distance
 * from the target. If too close, it retreats; if too far, it approaches; if within margin, it strafes.
 * Useful for ranged or cautious enemies.
 * Now uses A* pathfinding via the nextWaypoint provided in context for obstacle avoidance.
 */
import { IMovementPattern, MovementPatternContext, IRetreatPattern } from './types';
import { Entity } from '@engine/ecs/Entity';
import { Vector2 } from '@engine/math/Vector2';
import { Transform } from '@engine/ecs/components/Transform';
import { Pathfinding } from '@engine/ecs/pathfinding/Grid';

/**
 * PatternAIComponent is a minimal interface for an AI component that stores the current pattern definition.
 * This is used to pass pattern parameters to the movement logic.
 */
interface PatternAIComponent {
  pattern: IRetreatPattern;
}

export class RetreatPattern implements IMovementPattern {
  /**
   * Returns a normalized direction vector toward the optimal retreat/approach/strafe cell using pathfinding,
   * or computes fallback direction if no path is available.
   * @param entity The AI-controlled entity
   * @param target The target entity (e.g., player)
   * @param context Includes grid for pathfinding
   */
  getMoveDirection(entity: Entity, target: Entity, context: MovementPatternContext): Vector2 {
    const aiComponent = entity.getComponent('ai') as PatternAIComponent | undefined;
    const patternDef = aiComponent?.pattern;
    const pos = (entity.getComponent('transform') as Transform)?.getPosition();
    if (!pos || !patternDef) return { x: 0, y: 0 };
    const targetPos = (target.getComponent('transform') as Transform)?.getPosition();
    if (!targetPos) return { x: 0, y: 0 };
    const grid = context.grid;
    const dx = targetPos.x - pos.x;
    const dy = targetPos.y - pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return { x: 1, y: 0 };
    const toTarget = { x: dx / dist, y: dy / dist };
    const optimalDistance = patternDef.idealDistance;
    const followThreshold = patternDef.followThreshold;
    const distanceMargin = patternDef.distanceMargin ?? 50;
    let goal: { x: number, y: number } = { x: targetPos.x, y: targetPos.y };
    if (dist < optimalDistance - distanceMargin) {
      // Too close, retreat: pick a cell away from the target
      goal = {
        x: pos.x - toTarget.x * grid.getCellSize() * 3,
        y: pos.y - toTarget.y * grid.getCellSize() * 3
      };
    } else if (dist > followThreshold) {
      // Too far, approach: pick a cell toward the target
      goal = {
        x: pos.x + toTarget.x * grid.getCellSize() * 3,
        y: pos.y + toTarget.y * grid.getCellSize() * 3
      };
    } else if (dist > optimalDistance + distanceMargin) {
      // Slightly too far, approach
      goal = {
        x: pos.x + toTarget.x * grid.getCellSize() * 2,
        y: pos.y + toTarget.y * grid.getCellSize() * 2
      };
    } else {
      // Within margin, strafe: pick a perpendicular cell
      goal = {
        x: pos.x - toTarget.y * grid.getCellSize() * 2,
        y: pos.y + toTarget.x * grid.getCellSize() * 2
      };
    }
    const enemyCell = grid.worldToGrid(pos.x, pos.y);
    let goalCell = grid.worldToGrid(goal.x, goal.y);
    // Ensure goalCell is walkable; if not, search nearby
    if (!grid.isWalkable(goalCell.x, goalCell.y)) {
      let found = false;
      const radius = 2;
      for (let r = 1; r <= radius && !found; r++) {
        for (let dx = -r; dx <= r && !found; dx++) {
          for (let dy = -r; dy <= r && !found; dy++) {
            const cx = goalCell.x + dx;
            const cy = goalCell.y + dy;
            if (grid.inBounds(cx, cy) && grid.isWalkable(cx, cy)) {
              goalCell = { x: cx, y: cy };
              found = true;
            }
          }
        }
      }
      // If not found, fallback to original goalCell (will likely fail pathfinding)
    }
    const path = Pathfinding.findPath(grid, enemyCell, goalCell);
    // Convert path to world coordinates for debug
    if (context) {
      context.debugPath = path.map(cell => grid.gridToWorld(cell.x, cell.y));
    }
    if (path.length > 1) {
      const next = grid.gridToWorld(path[1].x, path[1].y);
      const ndx = next.x - pos.x;
      const ndy = next.y - pos.y;
      const ndist = Math.sqrt(ndx * ndx + ndy * ndy);
      if (ndist === 0) return { x: 1, y: 0 };
      return { x: ndx / ndist, y: ndy / ndist };
    }
    // Fallback: no path found, do not move through obstacles
    return { x: 0, y: 0 };
  }
} 