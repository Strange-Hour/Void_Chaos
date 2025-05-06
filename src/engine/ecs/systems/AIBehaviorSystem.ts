import { System } from '@engine/ecs/System';
import { Entity } from '@engine/ecs/Entity';
import { AI } from '@engine/ecs/components/AI';
import { Transform } from '@engine/ecs/components/Transform';
import { CharacterController } from '@engine/ecs/components/CharacterController';
import { Vector2 } from '@engine/math/Vector2';
import { World } from '../World';
// Add import for enemy type lookup
import { MovementPatternRegistry } from '../ai/patterns';
import { MovementPatternContext, MovementPatternDefinition } from '../ai/patterns/types';


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

/**
 * AIBehaviorSystem
 *
 * This system manages AI entity behavior and movement patterns. It delegates all movement direction logic
 * to the movement pattern system. For each AI entity, it retrieves the current movement pattern from the AI component,
 * looks up the implementation in the MovementPatternRegistry, builds the context (grid, path, nextWaypoint, etc.),
 * and calls getMoveDirection. The returned direction is used for movement and aiming.
 *
 * This system no longer contains any direct movement logic for chase, flank, retreat, etc. All such logic is encapsulated
 * in pluggable pattern classes.
 */

export class AIBehaviorSystem extends System {
  private aiEntities: AIEntity[] = [];
  private playerEntities: PlayerEntity[] = [];
  // Add path cache for each AI entity
  private pathCache: WeakMap<Entity, { path: Array<{ x: number, y: number }>, waypointIndex: number, lastEnemyCell: { x: number, y: number }, lastTargetCell: { x: number, y: number }, lastKnownPlayerCell: { x: number, y: number }, wanderTarget?: { x: number, y: number } }> = new WeakMap();
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
    aiEntities.forEach(({ ai, transform }) => {
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
            const dx = playerPos.x - myPosition.x;
            const dy = playerPos.y - myPosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
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

  /**
   * Main update loop for AI entities.
   *
   * For each AI entity:
   *   - Computes pathfinding (A*) to the target (usually the player)
   *   - Retrieves the current movement pattern from the AI component
   *   - Looks up the pattern implementation from the registry
   *   - Builds the context (grid, path, nextWaypoint, etc.)
   *   - Calls getMoveDirection on the pattern, passing all context
   *   - Uses the returned direction for movement and aiming
   *
   * All movement logic is now delegated to the pattern system.
   */
  fixedUpdate(deltaTime: number): void {
    const dtMillis = deltaTime * 1000;

    if (this.playerEntities.length === 0) {
      this.aiEntities.forEach(({ controller }) => controller.setMoveDirection({ x: 0, y: 0 }));
      return;
    }

    const activePlayer = this.playerEntities[0];
    const playerPosition = activePlayer.transform.getPosition();
    const grid = this.world?.getGrid();

    this.aiEntities.forEach(({ entity, ai, controller }) => {
      // Always set the target to the player
      const target = { position: { ...playerPosition }, entity: activePlayer.entity };
      ai.setTarget(target);
      if (grid && target) {
        // --- State machine integration ---
        const stateMachine = ai.getStateMachine?.();
        let patternDef: MovementPatternDefinition | undefined;
        if (stateMachine) {
          stateMachine.update({ entity, ai, target: activePlayer.entity, context: { grid } });
          patternDef = stateMachine.getCurrentPattern();
        } else {
          patternDef = ai.getCurrentPatternDefinition();
        }
        const patternImpl = patternDef ? MovementPatternRegistry[patternDef.type] : undefined;
        const patternContext: MovementPatternContext = stateMachine ? { grid, stateData: stateMachine.getStateData() } : { grid };

        let moveDir: Vector2 = { x: 0, y: 0 };
        if (patternImpl && target.entity) {
          moveDir = patternImpl.getMoveDirection(entity, target.entity, patternContext);
          // Store the debug path for visualization
          if (patternContext.debugPath) {
            ai.setCurrentPath(patternContext.debugPath);
          } else {
            ai.setCurrentPath([]);
          }
        }
        controller.setMoveDirection(moveDir);
        controller.setAimDirection(moveDir);
      } else {
        controller.setMoveDirection({ x: 0, y: 0 });
        controller.setAimDirection({ x: 1, y: 0 });
      }
      ai.update(dtMillis);
    });
  }

  update(): void {
    // No-op, main logic in fixedUpdate
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