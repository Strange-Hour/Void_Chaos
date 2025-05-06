/**
 * ChasePattern implements direct pursuit of the target (e.g., player).
 * Used for basic enemy AI that moves straight toward its target.
 * Now uses A* pathfinding via the nextWaypoint provided in context for obstacle avoidance.
 */
import { IMovementPattern, MovementPatternContext } from './types';
import { Entity } from '@engine/ecs/Entity';
import { Vector2 } from '@engine/math/Vector2';
import { Transform } from '@engine/ecs/components/Transform';
import { Pathfinding } from '@engine/ecs/pathfinding/Grid';

export class ChasePattern implements IMovementPattern {
  /**
   * Returns a normalized direction vector toward the next waypoint in the path (if available),
   * or directly toward the target if no path is available.
   * @param entity The AI-controlled entity
   * @param target The target entity (e.g., player)
   * @param context Includes grid for pathfinding
   */
  getMoveDirection(entity: Entity, target: Entity, context: MovementPatternContext): Vector2 {
    const pos = (entity.getComponent('transform') as Transform)?.getPosition();
    if (!pos) return { x: 0, y: 0 };
    const targetPos = (target.getComponent('transform') as Transform)?.getPosition();
    if (!targetPos) return { x: 0, y: 0 };
    // Pathfind to the target's cell
    const grid = context.grid;
    const enemyCell = grid.worldToGrid(pos.x, pos.y);
    let targetCell = grid.worldToGrid(targetPos.x, targetPos.y);
    // Ensure target cell is walkable; if not, find nearest walkable cell
    if (!grid.isWalkable(targetCell.x, targetCell.y)) {
      let found = false;
      const radius = 2; // search radius in cells
      for (let r = 1; r <= radius && !found; r++) {
        for (let dx = -r; dx <= r && !found; dx++) {
          for (let dy = -r; dy <= r && !found; dy++) {
            const cx = targetCell.x + dx;
            const cy = targetCell.y + dy;
            if (grid.inBounds(cx, cy) && grid.isWalkable(cx, cy)) {
              targetCell = { x: cx, y: cy };
              found = true;
            }
          }
        }
      }
      // If not found, fallback to original targetCell (will likely fail pathfinding)
    }
    const path = Pathfinding.findPath(grid, enemyCell, targetCell);
    // Convert path to world coordinates for debug
    if (context) {
      context.debugPath = path.map(cell => grid.gridToWorld(cell.x, cell.y));
    }
    if (path.length > 1) {
      // Move toward the next waypoint (skip the first cell, which is the current position)
      const next = grid.gridToWorld(path[1].x, path[1].y);
      const dx = next.x - pos.x;
      const dy = next.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return { x: 1, y: 0 };
      return { x: dx / dist, y: dy / dist };
    }
    // Fallback: no path found, do not move through obstacles
    return { x: 0, y: 0 };
  }
} 