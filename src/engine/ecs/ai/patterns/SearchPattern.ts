import { IMovementPattern, MovementPatternContext, ISearchPattern } from './types';
import { Entity } from '@engine/ecs/Entity';
import { Vector2 } from '@engine/math/Vector2';
import { Transform } from '@engine/ecs/components/Transform';
import { Pathfinding } from '@engine/ecs/pathfinding/Grid';

// Track wander targets per entity
const wanderTargets: WeakMap<Entity, { x: number, y: number }> = new WeakMap();

function getPatrolRadius(entity: Entity): number | undefined {
  // Try to get patrolRadius or detectionRange from the entity (if present)
  if ('patrolRadius' in entity && typeof (entity as { patrolRadius?: number }).patrolRadius === 'number') {
    return (entity as { patrolRadius: number }).patrolRadius;
  }
  if ('detectionRange' in entity && typeof (entity as { detectionRange?: number }).detectionRange === 'number') {
    return (entity as { detectionRange: number }).detectionRange;
  }
  return undefined;
}

function getTargetPosition(target: unknown, fallback: { x: number, y: number }): { x: number, y: number } {
  if (typeof target === 'object' && target !== null && 'position' in target) {
    const pos = (target as { position?: { x: number, y: number } }).position;
    if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
      return pos;
    }
  }
  return fallback;
}

export class SearchPattern implements IMovementPattern {
  getMoveDirection(entity: Entity, target: Entity, context: MovementPatternContext): Vector2 {
    const pos = (entity.getComponent('transform') as Transform)?.getPosition();
    if (!pos) return { x: 0, y: 0 };
    // Get pattern config from AI component if available
    const aiComponent = entity.getComponent('ai') as { pattern?: ISearchPattern } | undefined;
    const patternDef = aiComponent?.pattern as ISearchPattern | undefined;
    // Use searchRadius from pattern, or fallback to patrolRadius or detectionRange
    const searchRadius = patternDef?.searchRadius || getPatrolRadius(entity) || 128;
    // Use last known player position (target may be a player entity or a dummy with .position)
    const center = getTargetPosition(target, pos);
    // Set debug flags for DebugSystem
    (entity as unknown as { __isSearching?: boolean }).__isSearching = true;
    (entity as unknown as { __patrolRadius?: number }).__patrolRadius = searchRadius;
    const grid = context.grid;
    // Pick or reuse a wander target
    let wanderTarget = wanderTargets.get(entity);
    let needsNewTarget = false;
    // If no target or reached target, pick a new one
    if (!wanderTarget) {
      needsNewTarget = true;
    } else {
      const dist = Math.sqrt((wanderTarget.x - pos.x) ** 2 + (wanderTarget.y - pos.y) ** 2);
      if (dist < grid.getCellSize() * 0.5) needsNewTarget = true;
    }
    if (needsNewTarget) {
      // Try up to 10 times to find a random walkable cell within radius
      let found = false;
      for (let i = 0; i < 10 && !found; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * searchRadius;
        const wx = center.x + Math.cos(angle) * r;
        const wy = center.y + Math.sin(angle) * r;
        const cell = grid.worldToGrid(wx, wy);
        if (grid.inBounds(cell.x, cell.y) && grid.isWalkable(cell.x, cell.y)) {
          wanderTarget = grid.gridToWorld(cell.x, cell.y);
          wanderTargets.set(entity, wanderTarget);
          found = true;
        }
      }
      if (!found) {
        // No valid target found, stay idle
        wanderTargets.delete(entity);
        return { x: 0, y: 0 };
      }
    }
    // Pathfind to wander target
    if (!wanderTarget) return { x: 0, y: 0 };
    const enemyCell = grid.worldToGrid(pos.x, pos.y);
    const targetCell = grid.worldToGrid(wanderTarget.x, wanderTarget.y);
    const path = Pathfinding.findPath(grid, enemyCell, targetCell);
    // Convert path to world coordinates for debug
    if (context) {
      context.debugPath = path.map(cell => grid.gridToWorld(cell.x, cell.y));
    }
    if (path.length > 1) {
      const next = grid.gridToWorld(path[1].x, path[1].y);
      const dx = next.x - pos.x;
      const dy = next.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return { x: 1, y: 0 };
      return { x: dx / dist, y: dy / dist };
    }
    // If can't path, pick a new target next frame
    wanderTargets.delete(entity);
    return { x: 0, y: 0 };
  }
} 