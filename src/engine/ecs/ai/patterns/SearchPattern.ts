import { IMovementPattern, MovementPatternContext, ISearchPattern } from './types';
import { Entity } from '@engine/ecs/Entity';
import { Vector2 } from '@engine/math/Vector2';
import { Transform } from '@engine/ecs/components/Transform';
import { Pathfinding } from '@engine/ecs/pathfinding/Grid';
import { debugSearchStateMap, getEntityId } from './utils/debugSearchState';

export class SearchPattern implements IMovementPattern {
  getMoveDirection(entity: Entity, target: Entity, context: MovementPatternContext): Vector2 {
    const pos = (entity.getComponent('transform') as Transform)?.getPosition();
    if (!pos) return { x: 0, y: 0 };
    // Type guard for stateData
    type SearchPatternStateData = {
      lastKnownPlayerPosition?: { x: number, y: number };
      wanderTarget?: { x: number, y: number };
      hasReachedLastKnown?: boolean;
      failedToReachLastKnown?: number;
    };
    const stateData = (context as { stateData?: SearchPatternStateData }).stateData;
    const lastKnown = stateData?.lastKnownPlayerPosition;
    // Get pattern config from AI component if available
    const aiComponent = entity.getComponent('ai') as { pattern?: ISearchPattern } | undefined;
    const patternDef = aiComponent?.pattern as ISearchPattern | undefined;
    const searchRadius = patternDef?.searchRadius || 128;
    if (!lastKnown) {
      // Always update debug state on early return
      const entityId = getEntityId(entity);
      console.warn(`[SearchPattern] No lastKnownPlayerPosition for entity ${entityId} in search state`, { entityId, stateData });
      debugSearchStateMap.set(entityId, { isSearching: false, patrolRadius: undefined });
      // Additional log for root cause analysis
      console.log(`[SearchPattern] Early return: no lastKnown for entity ${entityId}`, { stateData });
      return { x: 0, y: 0 }; // Idle if no last known
    }
    // Always set debug state to searching if lastKnown is present
    const entityId = getEntityId(entity);
    debugSearchStateMap.set(entityId, { isSearching: true, patrolRadius: searchRadius });
    const grid = context.grid;
    // Check if we've already reached lastKnown in this search session
    if (stateData && stateData.hasReachedLastKnown) {
      // Only wander
      let wanderTarget = stateData?.wanderTarget;
      let needsNewTarget = false;
      if (!wanderTarget) {
        needsNewTarget = true;
      } else {
        const dist = Math.sqrt((wanderTarget.x - pos.x) ** 2 + (wanderTarget.y - pos.y) ** 2);
        if (dist < grid.getCellSize() * 0.5) needsNewTarget = true;
      }
      if (needsNewTarget) {
        let found = false;
        for (let i = 0; i < 10 && !found; i++) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * (searchRadius * 2);
          const wx = lastKnown.x + Math.cos(angle) * r;
          const wy = lastKnown.y + Math.sin(angle) * r;
          const cell = grid.worldToGrid(wx, wy);
          if (grid.inBounds(cell.x, cell.y) && grid.isWalkable(cell.x, cell.y)) {
            wanderTarget = grid.gridToWorld(cell.x, cell.y);
            if (stateData) stateData.wanderTarget = wanderTarget;
            found = true;
          }
        }
        if (!found) {
          if (stateData) stateData.wanderTarget = undefined;
          // Always update debug state on early return
          console.warn(`[SearchPattern] Could not find wander target for entity ${entityId} in search state (searchRadius: ${searchRadius})`, { entityId, lastKnown, searchRadius });
          debugSearchStateMap.set(entityId, { isSearching: true, patrolRadius: searchRadius });
          // Log wander target failure
          console.log(`[SearchPattern] Early return: no wanderTarget found for entity ${entityId}`, { lastKnown, searchRadius });
          return { x: 0, y: 0 };
        }
      }
      if (!wanderTarget) {
        // Always update debug state on early return
        console.warn(`[SearchPattern] No wanderTarget for entity ${entityId} in search state`, { entityId, lastKnown, stateData });
        // Log missing wanderTarget
        console.log(`[SearchPattern] Early return: wanderTarget missing for entity ${entityId}`, { lastKnown, stateData });
        return { x: 0, y: 0 };
      }
      const enemyCell = grid.worldToGrid(pos.x, pos.y);
      const targetCell = grid.worldToGrid(wanderTarget.x, wanderTarget.y);
      const path = Pathfinding.findPath(grid, enemyCell, targetCell);
      if (context) {
        context.debugPath = path.map(cell => grid.gridToWorld(cell.x, cell.y));
      }
      if (path.length > 1) {
        const next = grid.gridToWorld(path[1].x, path[1].y);
        const dx = next.x - pos.x;
        const dy = next.y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const moveVec = dist === 0 ? { x: 1, y: 0 } : { x: dx / dist, y: dy / dist };
        return moveVec;
      }
      if (stateData) stateData.wanderTarget = undefined;
      return { x: 0, y: 0 };
    } else {
      const wanderThreshold = searchRadius * 0.5;
      const dist = Math.sqrt((lastKnown.x - pos.x) ** 2 + (lastKnown.y - pos.y) ** 2);
      if (dist > wanderThreshold) {
        const enemyCell = grid.worldToGrid(pos.x, pos.y);
        const targetCell = grid.worldToGrid(lastKnown.x, lastKnown.y);
        const path = Pathfinding.findPath(grid, enemyCell, targetCell);
        if (context) {
          context.debugPath = path.map(cell => grid.gridToWorld(cell.x, cell.y));
        }
        if (path.length > 1) {
          const next = grid.gridToWorld(path[1].x, path[1].y);
          const dx = next.x - pos.x;
          const dy = next.y - pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const moveVec = dist === 0 ? { x: 1, y: 0 } : { x: dx / dist, y: dy / dist };
          // Reset failed attempts counter
          if (stateData) stateData.failedToReachLastKnown = 0;
          return moveVec;
        }
        // If path is too short, increment failed attempts
        if (stateData) {
          stateData.failedToReachLastKnown = (stateData.failedToReachLastKnown || 0) + 1;
          if (stateData.failedToReachLastKnown > 30) {
            stateData.hasReachedLastKnown = true;
            stateData.failedToReachLastKnown = 0;
            console.warn(`[SearchPattern] Forcing wander for entity ${entityId} after repeated failed attempts to reach lastKnown.`);
          }
        }
        // If path is too short, fallback to wandering logic below (do not return early)
      } else {
        // Mark as reached lastKnown
        if (stateData) stateData.hasReachedLastKnown = true;
        // If close to last known, or pathfinding failed, wander within search radius
        let wanderTarget = stateData?.wanderTarget;
        let needsNewTarget = false;
        if (!wanderTarget) {
          needsNewTarget = true;
        } else {
          const dist = Math.sqrt((wanderTarget.x - pos.x) ** 2 + (wanderTarget.y - pos.y) ** 2);
          if (dist < grid.getCellSize() * 0.5) needsNewTarget = true;
        }
        if (needsNewTarget) {
          let found = false;
          for (let i = 0; i < 10 && !found; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * (searchRadius * 2);
            const wx = lastKnown.x + Math.cos(angle) * r;
            const wy = lastKnown.y + Math.sin(angle) * r;
            const cell = grid.worldToGrid(wx, wy);
            if (grid.inBounds(cell.x, cell.y) && grid.isWalkable(cell.x, cell.y)) {
              wanderTarget = grid.gridToWorld(cell.x, cell.y);
              if (stateData) stateData.wanderTarget = wanderTarget;
              found = true;
            }
          }
          if (!found) {
            if (stateData) stateData.wanderTarget = undefined;
            // Always update debug state on early return
            console.warn(`[SearchPattern] Could not find wander target for entity ${entityId} in search state (searchRadius: ${searchRadius})`, { entityId, lastKnown, searchRadius });
            debugSearchStateMap.set(entityId, { isSearching: true, patrolRadius: searchRadius });
            // Log wander target failure
            console.log(`[SearchPattern] Early return: no wanderTarget found for entity ${entityId}`, { lastKnown, searchRadius });
            return { x: 0, y: 0 };
          }
        }
        if (!wanderTarget) {
          // Always update debug state on early return
          console.warn(`[SearchPattern] No wanderTarget for entity ${entityId} in search state`, { entityId, lastKnown, stateData });
          // Log missing wanderTarget
          console.log(`[SearchPattern] Early return: wanderTarget missing for entity ${entityId}`, { lastKnown, stateData });
          return { x: 0, y: 0 };
        }
        const enemyCell = grid.worldToGrid(pos.x, pos.y);
        const targetCell = grid.worldToGrid(wanderTarget.x, wanderTarget.y);
        const path = Pathfinding.findPath(grid, enemyCell, targetCell);
        if (context) {
          context.debugPath = path.map(cell => grid.gridToWorld(cell.x, cell.y));
        }
        if (path.length > 1) {
          const next = grid.gridToWorld(path[1].x, path[1].y);
          const dx = next.x - pos.x;
          const dy = next.y - pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const moveVec = dist === 0 ? { x: 1, y: 0 } : { x: dx / dist, y: dy / dist };

          return moveVec;
        }
        if (stateData) stateData.wanderTarget = undefined;
        return { x: 0, y: 0 };
      }
    }
    // If all logic paths fail, return idle vector
    return { x: 0, y: 0 };
  }
} 