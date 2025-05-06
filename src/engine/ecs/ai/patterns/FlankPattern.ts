/**
 * FlankPattern implements a movement strategy where the AI attempts to move around the target,
 * aiming to get behind the player by taking a wide arc. This is useful for enemies that should
 * avoid direct confrontation and instead try to outmaneuver the player.
 * Now uses A* pathfinding via the nextWaypoint provided in context for obstacle avoidance.
 */
import { IMovementPattern, MovementPatternContext } from './types';
import { Entity } from '@engine/ecs/Entity';
import { Vector2 } from '@engine/math/Vector2';
import { Transform } from '@engine/ecs/components/Transform';
import { Pathfinding } from '@engine/ecs/pathfinding/Grid';

export class FlankPattern implements IMovementPattern {
  /**
   * Returns a normalized direction vector toward a flanking cell behind/around the target using pathfinding.
   * @param entity The AI-controlled entity
   * @param target The target entity (e.g., player)
   * @param context Includes grid for pathfinding
   */
  getMoveDirection(entity: Entity, target: Entity, context: MovementPatternContext): Vector2 {
    const pos = (entity.getComponent('transform') as Transform)?.getPosition();
    if (!pos) return { x: 0, y: 0 };
    const targetPos = (target.getComponent('transform') as Transform)?.getPosition();
    if (!targetPos) return { x: 0, y: 0 };
    const grid = context.grid;
    // Compute vector from player to enemy
    const dx = pos.x - targetPos.x;
    const dy = pos.y - targetPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    // Flank parameters (could be made configurable)
    const flankDistCells = 3;
    const arcOffsetCells = 1.5;
    // Compute behind position (relative to player)
    const behindX = targetPos.x + (dx / dist) * grid.getCellSize() * flankDistCells;
    const behindY = targetPos.y + (dy / dist) * grid.getCellSize() * flankDistCells;
    // Perpendicular for arc
    const perp = { x: -dy / dist, y: dx / dist };
    const arcX = behindX + perp.x * grid.getCellSize() * arcOffsetCells;
    const arcY = behindY + perp.y * grid.getCellSize() * arcOffsetCells;
    const flankCell = grid.worldToGrid(arcX, arcY);
    // If not walkable, fallback to behind only
    let goalCell = flankCell;
    if (!grid.isWalkable(flankCell.x, flankCell.y)) {
      const behindCell = grid.worldToGrid(behindX, behindY);
      if (grid.isWalkable(behindCell.x, behindCell.y)) {
        goalCell = behindCell;
      } else {
        // Fallback: just use the player's cell
        goalCell = grid.worldToGrid(targetPos.x, targetPos.y);
      }
    }
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
    const enemyCell = grid.worldToGrid(pos.x, pos.y);
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