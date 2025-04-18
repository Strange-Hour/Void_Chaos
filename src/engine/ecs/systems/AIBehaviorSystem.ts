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

  constructor() {
    // Only require transform as it's common to both AI and players
    super(['transform']);
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

    this.aiEntities.forEach(({ entity, ai, transform, controller }) => {
      let target = ai.getTarget();
      let targetPosition: Vector2 | null = null;

      if (!target || !target.entity || target.entity.getId() !== activePlayer.entity.getId()) {
        target = { position: { ...playerPosition }, entity: activePlayer.entity };
        ai.setTarget(target);
      } else {
        const storedTargetPos = target.position;
        const dx = storedTargetPos.x - playerPosition.x;
        const dy = storedTargetPos.y - playerPosition.y;
        const squaredDistance = dx * dx + dy * dy;
        const MIN_UPDATE_DIST_SQ = 0.1 * 0.1;

        if (squaredDistance > MIN_UPDATE_DIST_SQ) {
          storedTargetPos.x = playerPosition.x;
          storedTargetPos.y = playerPosition.y;
        }
      }

      targetPosition = target.position;
      const patternDef = ai.getCurrentPatternDefinition();

      if (!patternDef || (patternDef.targetType === 'player' && !targetPosition)) {
        controller.setMoveDirection({ x: 0, y: 0 });
        controller.setAimDirection({ x: 1, y: 0 });
        ai.update(dtMillis);
        return;
      }

      const position = transform.getPosition();
      let distanceToTarget = 0;
      let directionToTarget: Vector2 = { x: 1, y: 0 };

      if (targetPosition && patternDef.targetType === 'player') {
        distanceToTarget = this.getDistance(position, targetPosition);
        directionToTarget = this.getDirection(position, targetPosition);
      }

      switch (patternDef.type) {
        case 'chase':
          this.updateChaseState(controller, directionToTarget, patternDef as IChasePattern);
          break;
        case 'flank':
          if (targetPosition) {
            this.updateFlankState(controller, position, targetPosition, directionToTarget, patternDef as IFlankPattern);
          }
          break;
        case 'retreat':
          if (targetPosition) {
            this.updateKeepDistanceState(controller, distanceToTarget, directionToTarget, patternDef as IRetreatPattern);
          }
          break;
        case 'idle':
        default:
          controller.setMoveDirection({ x: 0, y: 0 });
          break;
      }

      if (targetPosition) {
        controller.setAimDirection(directionToTarget);
      }

      ai.update(dtMillis);
    });
  }

  update(deltaTime: number): void {
    // No-op, main logic in fixedUpdate
  }

  private updateChaseState(
    controller: CharacterController,
    directionToTarget: Vector2,
    patternDef: IChasePattern
  ): void {
    controller.setMoveDirection(directionToTarget);
  }

  private updateFlankState(
    controller: CharacterController,
    position: Vector2,
    targetPosition: Vector2,
    directionToTarget: Vector2,
    patternDef: IFlankPattern
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
    controller: CharacterController,
    distanceToTarget: number,
    directionToTarget: Vector2,
    patternDef: IRetreatPattern
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