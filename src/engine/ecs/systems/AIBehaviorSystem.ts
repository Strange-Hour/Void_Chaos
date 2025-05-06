import { System } from '@engine/ecs/System';
import { Entity } from '@engine/ecs/Entity';
import { AI } from '@engine/ecs/components/AI';
import { Transform } from '@engine/ecs/components/Transform';
import { CharacterController } from '@engine/ecs/components/CharacterController';
import { Vector2 } from '@engine/math/Vector2';
// Import pattern types
import {
  IChasePattern,
  IRetreatPattern,
  IFlankPattern
} from '../ai/patterns/types';
import { Pathfinding } from '../pathfinding/Grid';
import { World } from '../World';

interface AIEntity {
  entity: Entity;
  ai: AI;
  transform: Transform;
  controller: CharacterController;
}

interface PlayerEntity {
  entity: Entity;
  transform: Transform;
}

export class AIBehaviorSystem extends System {
  private aiEntities: AIEntity[] = [];
  private playerEntities: PlayerEntity[] = [];
  // Add path cache for each AI entity
  private pathCache: WeakMap<Entity, { path: Array<{ x: number, y: number }>, waypointIndex: number, lastEnemyCell: { x: number, y: number }, lastTargetCell: { x: number, y: number }, lastKnownPlayerCell: { x: number, y: number } }> = new WeakMap();
  private world?: World;

  constructor(world?: World) {
    // Only require transform as it's common to both AI and players
    super(['transform']);
    this.world = world;
  }

  /**
   * Override addEntity to call the specific onEntityAdded logic.
   */
  addEntity(entity: Entity): void {
    // Call the base class addEntity first
    super.addEntity(entity);

    // If the entity was successfully added by the base class (i.e., it has the required components)
    // then call our specific logic.
    if (this.entities.has(entity)) {
      this.onEntityAdded(entity);
    }
  }

  /**
   * Override removeEntity to call the specific onEntityRemoved logic.
   */
  removeEntity(entity: Entity): void {
    // Call our specific logic first (before removing from the base set)
    this.onEntityRemoved(entity);
    // Then call the base class removeEntity
    super.removeEntity(entity);
  }

  onEntityAdded(entity: Entity): void {
    if (entity.hasComponent('ai') &&
      entity.hasComponent('character-controller')) {
      this.aiEntities.push({
        entity,
        ai: entity.getComponent('ai') as AI,
        transform: entity.getComponent('transform') as Transform,
        controller: entity.getComponent('character-controller') as CharacterController
      });
    }

    if (entity.hasComponent('player')) {
      this.playerEntities.push({
        entity,
        transform: entity.getComponent('transform') as Transform
      });
    }
  }

  onEntityRemoved(entity: Entity): void {
    this.aiEntities = this.aiEntities.filter(e => e.entity !== entity);
    this.playerEntities = this.playerEntities.filter(e => e.entity !== entity);
  }

  /**
   * Updates AI targets with fresh player positions using provided player entities
   * @param players Array of player entities
   * @param aiEntities Array of AI entities to update
   */
  private updateAITargetsWithPlayers(players: Entity[], aiEntities: AIEntity[]): void {
    if (!players.length) return;

    // For each AI entity, update its target to the current player position
    aiEntities.forEach(({ entity, ai, transform }) => {
      const target = ai.getTarget();

      // Only update if target actually exists
      if (target && target.entity) {
        // Get the current position of the target entity
        const targetEntity = target.entity;
        const targetTransform = targetEntity.getComponent('transform') as Transform;

        if (targetTransform) {
          // Get the most current position coordinates
          const currentPos = targetTransform.getPosition();

          // Check if position has actually changed to avoid unnecessary updates
          const dx = target.position.x - currentPos.x;
          const dy = target.position.y - currentPos.y;
          const squaredDistance = dx * dx + dy * dy;
          const MIN_UPDATE_DIST_SQ = 0.1 * 0.1; // Update if moved more than 0.1 pixels

          if (squaredDistance > MIN_UPDATE_DIST_SQ) {
            // Directly update the target position without creating a new target object
            target.position.x = currentPos.x;
            target.position.y = currentPos.y;
          }
        }
      } else if (players.length > 0) {
        // If no target set yet but players exist, target closest player
        let closestPlayer = players[0];
        let closestDistance = Infinity;

        const myPosition = transform.getPosition();

        players.forEach(player => {
          const playerTransform = player.getComponent('transform') as Transform;
          if (playerTransform) {
            const playerPos = playerTransform.getPosition();
            const distance = this.getDistance(myPosition, playerPos);

            if (distance < closestDistance) {
              closestDistance = distance;
              closestPlayer = player;
            }
          }
        });

        const closestPlayerTransform = closestPlayer.getComponent('transform') as Transform;
        if (closestPlayerTransform) {
          const playerPos = closestPlayerTransform.getPosition();
          ai.setTarget({
            position: { x: playerPos.x, y: playerPos.y },
            entity: closestPlayer
          });
        }
      }
    });
  }

  fixedUpdate(deltaTime: number): void {
    const dtMillis = deltaTime * 1000;

    if (this.playerEntities.length === 0) {
      this.aiEntities.forEach(({ controller }) => controller.setMoveDirection({ x: 0, y: 0 }));
      return;
    }

    const activePlayer = this.playerEntities[0];
    const playerPosition = activePlayer.transform.getPosition();
    const grid = this.world?.getGrid();
    const cellSize = grid?.getCellSize() ?? 32;

    this.aiEntities.forEach(({ entity, ai, transform, controller }) => {
      let target = ai.getTarget();
      let targetPosition: Vector2 | null = null;
      // Always set the target to the player
      target = { position: { ...playerPosition }, entity: activePlayer.entity };
      ai.setTarget(target);
      targetPosition = target.position;
      const position = transform.getPosition();
      if (grid && targetPosition) {
        const enemyCell = grid.worldToGrid(position.x, position.y);
        const targetCell = grid.worldToGrid(targetPosition.x, targetPosition.y);
        let cache = this.pathCache.get(entity);
        // Track last known player cell
        if (!cache) {
          cache = {
            path: [],
            waypointIndex: 0,
            lastEnemyCell: { ...enemyCell },
            lastTargetCell: { ...targetCell },
            lastKnownPlayerCell: { ...targetCell }
          };
        }
        // If player cell is visible, update last known
        if (grid.isWalkable(targetCell.x, targetCell.y)) {
          cache.lastKnownPlayerCell = { ...targetCell };
        }
        // Try to pathfind to player
        let path = Pathfinding.findPath(grid, enemyCell, targetCell);
        let searching = false;
        if (path.length <= 1) {
          // Can't reach player, try last known player cell
          path = Pathfinding.findPath(grid, enemyCell, cache.lastKnownPlayerCell);
          searching = true;
        }
        this.pathCache.set(entity, {
          ...cache,
          path,
          waypointIndex: 0,
          lastEnemyCell: { ...enemyCell },
          lastTargetCell: { ...targetCell },
          lastKnownPlayerCell: { ...cache.lastKnownPlayerCell }
        });
        cache = this.pathCache.get(entity);
        if (cache && cache.path.length > 1 && cache.waypointIndex < cache.path.length) {
          // Move toward next waypoint
          const nextWaypoint = cache.path[cache.waypointIndex + 1] || cache.path[cache.waypointIndex];
          const waypointWorld = grid.gridToWorld(nextWaypoint.x, nextWaypoint.y);
          const dx = waypointWorld.x - position.x;
          const dy = waypointWorld.y - position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const threshold = cellSize * 0.2;
          let moveDir = { x: 0, y: 0 };
          if (dist > threshold) {
            moveDir = { x: dx / dist, y: dy / dist };
          } else {
            cache.waypointIndex++;
          }
          controller.setMoveDirection(moveDir);
          controller.setAimDirection(moveDir);
        } else {
          // If already at last known player cell, idle (future: wander)
          if (searching && enemyCell.x === cache.lastKnownPlayerCell.x && enemyCell.y === cache.lastKnownPlayerCell.y) {
            controller.setMoveDirection({ x: 0, y: 0 });
            controller.setAimDirection({ x: 1, y: 0 });
            // TODO: Add random wandering or patrolling here
          } else {
            controller.setMoveDirection({ x: 0, y: 0 });
            controller.setAimDirection({ x: 1, y: 0 });
          }
        }
      } else {
        controller.setMoveDirection({ x: 0, y: 0 });
        controller.setAimDirection({ x: 1, y: 0 });
      }
      ai.update(dtMillis);
    });
  }

  update(deltaTime: number): void {
    // No-op, main logic in fixedUpdate
  }

  private updateChaseState(
    controller: CharacterController,
    directionToTarget: Vector2
  ): void {
    controller.setMoveDirection(directionToTarget);
  }

  private updateFlankState(
    controller: CharacterController,
    position: Vector2,
    targetPosition: Vector2,
    directionToTarget: Vector2
  ): void {
    const flankWeight = patternDef.flankWeight ?? 0.3;
    const perpendicularDir = { x: -directionToTarget.y, y: directionToTarget.x };
    const dotProduct = (position.x - targetPosition.x) * perpendicularDir.x +
      (position.y - targetPosition.y) * perpendicularDir.y;

    if (dotProduct < 0) {
      perpendicularDir.x = -perpendicularDir.x;
      perpendicularDir.y = -perpendicularDir.y;
    }

    const approachWeight = 1 - flankWeight;
    const moveDirection = {
      x: approachWeight * directionToTarget.x + flankWeight * perpendicularDir.x,
      y: approachWeight * directionToTarget.y + flankWeight * perpendicularDir.y
    };

    const magnitude = Math.sqrt(moveDirection.x * moveDirection.x + moveDirection.y * moveDirection.y);
    if (magnitude > 0) {
      moveDirection.x /= magnitude;
      moveDirection.y /= magnitude;
    }

    controller.setMoveDirection(moveDirection);
  }

  private updateKeepDistanceState(
    controller: CharacterController
  ): void {
    const optimalDistance = patternDef.idealDistance;
    const followThreshold = patternDef.followThreshold;
    const distanceMargin = patternDef.distanceMargin ?? 50;

    if (distanceToTarget < optimalDistance - distanceMargin) {
      controller.setMoveDirection({ x: -directionToTarget.x, y: -directionToTarget.y });
    } else if (distanceToTarget > followThreshold) {
      controller.setMoveDirection(directionToTarget);
    } else if (distanceToTarget > optimalDistance + distanceMargin) {
      controller.setMoveDirection(directionToTarget);
    } else {
      controller.setMoveDirection({ x: -directionToTarget.y, y: directionToTarget.x });
    }
  }

  private getDistance(a: Vector2, b: Vector2): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getDirection(from: Vector2, to: Vector2): Vector2 {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return { x: 1, y: 0 };

    return {
      x: dx / distance,
      y: dy / distance
    };
  }
} 