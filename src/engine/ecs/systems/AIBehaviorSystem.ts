import { System } from '@engine/ecs/System';
import { Entity } from '@engine/ecs/Entity';
import { AI } from '@engine/ecs/components/AI';
import { Transform } from '@engine/ecs/components/Transform';
import { CharacterController } from '@engine/ecs/components/CharacterController';
import { Vector2 } from '@engine/math/Vector2';

interface AIEntity {
  entity: Entity;
  ai: AI;
  transform: Transform;
  controller: CharacterController;
}

export class AIBehaviorSystem extends System {
  private aiEntities: AIEntity[] = [];

  constructor() {
    super(['ai', 'transform', 'character-controller']);
  }

  onEntityAdded(entity: Entity): void {
    this.aiEntities.push({
      entity,
      ai: entity.getComponent('ai') as AI,
      transform: entity.getComponent('transform') as Transform,
      controller: entity.getComponent('character-controller') as CharacterController
    });
  }

  onEntityRemoved(entity: Entity): void {
    this.aiEntities = this.aiEntities.filter(e => e.entity !== entity);
  }

  /**
   * Updates AI targets with fresh player positions using provided player entities
   */
  private updateAITargetsWithPlayers(players: Entity[]): void {
    if (!players.length) return;

    // For each AI entity, update its target to the current player position
    this.aiEntities.forEach(({ ai, transform }) => {
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
          if (target.position.x !== currentPos.x || target.position.y !== currentPos.y) {
            console.log('Updating AI target position:', {
              from: { x: target.position.x, y: target.position.y },
              to: { x: currentPos.x, y: currentPos.y },
              entityId: targetEntity.getId()
            });
          }

          // Directly update the target position without creating a new target object
          target.position.x = currentPos.x;
          target.position.y = currentPos.y;
          // Re-apply the updated target
          ai.setTarget(target);
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
          console.log('Setting new AI target to player:', {
            position: { x: playerPos.x, y: playerPos.y },
            entityId: closestPlayer.getId()
          });
          ai.setTarget({
            position: { x: playerPos.x, y: playerPos.y },
            entity: closestPlayer
          });
        }
      }
    });
  }

  update(deltaTime: number): void {
    // Find player entities in every update to ensure we have the most current list
    const players: Entity[] = Array.from(this.entities).filter(entity =>
      entity.hasComponent('player') && entity.hasComponent('transform')
    );

    // Force target updates on every frame regardless of other logic
    // Update AI targets to track current player positions
    if (players.length > 0) {
      this.updateAITargetsWithPlayers(players);
    }

    // Get fresh player positions one more time to be absolutely sure
    players.forEach(player => {
      const playerTransform = player.getComponent('transform') as Transform;
      if (playerTransform) {
        const playerPos = playerTransform.getPosition();

        // Update all AI entities with this player's position
        this.aiEntities.forEach(({ ai }) => {
          const target = ai.getTarget();
          if (target && target.entity && target.entity.getId() === player.getId()) {
            // Directly update position without any extra calculations
            target.position.x = playerPos.x;
            target.position.y = playerPos.y;
          }
        });
      }
    });

    this.aiEntities.forEach(({ ai, transform, controller }) => {
      const target = ai.getTarget();
      if (!target) return;

      const currentState = ai.getCurrentState();
      if (!currentState) return;

      const position = transform.getPosition();
      const targetPosition = target.position;
      const distanceToTarget = this.getDistance(position, targetPosition);
      const directionToTarget = this.getDirection(position, targetPosition);

      switch (currentState) {
        case 'chase':
          this.updateChaseState(controller, directionToTarget);
          break;
        case 'attack':
          this.updateFlankState(controller, position, targetPosition, directionToTarget);
          break;
        case 'retreat':
          this.updateKeepDistanceState(controller, distanceToTarget, directionToTarget);
          break;
        case 'idle':
          controller.setMoveDirection({ x: 0, y: 0 });
          break;
      }

      // Update aim direction to always face target
      controller.setAimDirection(directionToTarget);

      // Update AI behaviors with deltaTime
      ai.update(deltaTime);
    });
  }

  private updateChaseState(controller: CharacterController, directionToTarget: Vector2): void {
    // Simple chase behavior - move directly towards target
    controller.setMoveDirection(directionToTarget);
  }

  private updateFlankState(
    controller: CharacterController,
    position: Vector2,
    targetPosition: Vector2,
    directionToTarget: Vector2
  ): void {
    // Calculate perpendicular vector for flanking
    const perpendicularDir = {
      x: -directionToTarget.y,
      y: directionToTarget.x
    };

    // Determine which side to flank based on current position
    const dotProduct = (position.x - targetPosition.x) * perpendicularDir.x +
      (position.y - targetPosition.y) * perpendicularDir.y;

    // If dot product is negative, use opposite perpendicular direction
    if (dotProduct < 0) {
      perpendicularDir.x = -perpendicularDir.x;
      perpendicularDir.y = -perpendicularDir.y;
    }

    // Combine flanking direction with approach direction
    const moveDirection = {
      x: 0.7 * directionToTarget.x + 0.3 * perpendicularDir.x,
      y: 0.7 * directionToTarget.y + 0.3 * perpendicularDir.y
    };

    // Normalize the combined direction
    const magnitude = Math.sqrt(moveDirection.x * moveDirection.x + moveDirection.y * moveDirection.y);
    moveDirection.x /= magnitude;
    moveDirection.y /= magnitude;

    controller.setMoveDirection(moveDirection);
  }

  private updateKeepDistanceState(
    controller: CharacterController,
    distanceToTarget: number,
    directionToTarget: Vector2
  ): void {
    const optimalDistance = 300; // Pixels
    const distanceMargin = 50; // Pixels

    if (distanceToTarget < optimalDistance - distanceMargin) {
      // Too close, move away
      controller.setMoveDirection({
        x: -directionToTarget.x,
        y: -directionToTarget.y
      });
    } else if (distanceToTarget > optimalDistance + distanceMargin) {
      // Too far, move closer
      controller.setMoveDirection(directionToTarget);
    } else {
      // Within optimal range, strafe
      controller.setMoveDirection({
        x: -directionToTarget.y,
        y: directionToTarget.x
      });
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