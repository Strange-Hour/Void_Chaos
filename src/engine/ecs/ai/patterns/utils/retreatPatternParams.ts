import { Entity } from '@engine/ecs/Entity';
import { IRetreatPattern } from '../types';
import { IEnemyTypeDefinition } from '@engine/ecs/enemies/types/IEnemyTypeDefinition';
import { Grid } from '@engine/ecs/pathfinding/Grid';
import { Vector2 } from '@engine/math/Vector2';
import { MovementPatternContext } from '../types';
import { Pathfinding } from '@engine/ecs/pathfinding/Grid';

interface PatternAIComponent {
  pattern: IRetreatPattern;
}

export function getRetreatPatternParams(entity: Entity): IRetreatPattern & { minDistance: number, maxDistance: number, strafeEnabled: boolean } {
  // Prefer AI component, fallback to enemy type definition
  const aiComponent = entity.getComponent('ai') as PatternAIComponent | undefined;
  if (aiComponent?.pattern) {
    return {
      minDistance: aiComponent.pattern.minDistance ?? (aiComponent.pattern.idealDistance - (aiComponent.pattern.distanceMargin ?? 40)),
      maxDistance: aiComponent.pattern.maxDistance ?? (aiComponent.pattern.idealDistance + (aiComponent.pattern.distanceMargin ?? 40)),
      strafeEnabled: aiComponent.pattern.strafeEnabled ?? true,
      ...aiComponent.pattern,
    };
  }
  const def = (entity as { enemyDef?: IEnemyTypeDefinition }).enemyDef;
  const pattern = def?.movementStateMachine.states.find(s => s.state === 'retreat')?.pattern as IRetreatPattern | undefined;
  if (pattern) {
    return {
      minDistance: pattern.minDistance ?? (pattern.idealDistance - (pattern.distanceMargin ?? 40)),
      maxDistance: pattern.maxDistance ?? (pattern.idealDistance + (pattern.distanceMargin ?? 40)),
      strafeEnabled: pattern.strafeEnabled ?? true,
      ...pattern,
    };
  }
  // Fallback defaults
  return {
    type: 'retreat',
    idealDistance: 200,
    followThreshold: 350,
    minDistance: 120,
    maxDistance: 300,
    distanceMargin: 40,
    strafeEnabled: true,
    targetType: 'player',
  };
}

/**
 * Returns a retreat goal that is always further from the player than the current position.
 * If the calculated goal is not further, increase the retreat distance until it is.
 */
export function getRetreatGoal(pos: Vector2, toTarget: Vector2, grid: Grid, playerPos?: Vector2): Vector2 {
  // Always retreat directly away from the player
  let retreatDistance = grid.getCellSize() * 3;
  let goal = {
    x: pos.x - toTarget.x * retreatDistance,
    y: pos.y - toTarget.y * retreatDistance,
  };
  if (playerPos) {
    const currentDist = Math.sqrt((playerPos.x - pos.x) ** 2 + (playerPos.y - pos.y) ** 2);
    let goalDist = Math.sqrt((playerPos.x - goal.x) ** 2 + (playerPos.y - goal.y) ** 2);
    // If the goal is not further, increase the retreat distance
    let attempts = 0;
    while (goalDist <= currentDist && attempts < 5) {
      retreatDistance += grid.getCellSize();
      goal = {
        x: pos.x - toTarget.x * retreatDistance,
        y: pos.y - toTarget.y * retreatDistance,
      };
      goalDist = Math.sqrt((playerPos.x - goal.x) ** 2 + (playerPos.y - goal.y) ** 2);
      attempts++;
    }
  }
  // Clamp goal to grid/world boundaries
  const minX = 0;
  const minY = 0;
  const maxX = grid.getWidth() * grid.getCellSize();
  const maxY = grid.getHeight() * grid.getCellSize();
  goal.x = Math.max(minX, Math.min(goal.x, maxX));
  goal.y = Math.max(minY, Math.min(goal.y, maxY));
  return goal;
}

export function getApproachGoal(pos: Vector2, toTarget: Vector2, grid: Grid): Vector2 {
  return {
    x: pos.x + toTarget.x * grid.getCellSize() * 3,
    y: pos.y + toTarget.y * grid.getCellSize() * 3,
  };
}

export function getStrafeGoal(pos: Vector2, toTarget: Vector2, grid: Grid): Vector2 {
  // Try both left and right strafe, pick walkable if needed (for now, just left)
  const perp = { x: -toTarget.y, y: toTarget.x };
  return {
    x: pos.x + perp.x * grid.getCellSize() * 2,
    y: pos.y + perp.y * grid.getCellSize() * 2,
  };
}

export function moveToGoal(pos: Vector2, goal: Vector2, grid: Grid, context: MovementPatternContext): Vector2 {
  let goalCell = grid.worldToGrid(goal.x, goal.y);
  if (!grid.isWalkable(goalCell.x, goalCell.y)) {
    // Try nearby cells
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
  if (context) context.debugPath = path.map((cell: { x: number, y: number }) => grid.gridToWorld(cell.x, cell.y));
  if (path.length > 1) {
    const next = grid.gridToWorld(path[1].x, path[1].y);
    const ndx = next.x - pos.x;
    const ndy = next.y - pos.y;
    const ndist = Math.sqrt(ndx * ndx + ndy * ndy);
    if (ndist === 0) return { x: 1, y: 0 };
    return { x: ndx / ndist, y: ndy / ndist };
  }
  return { x: 0, y: 0 };
} 