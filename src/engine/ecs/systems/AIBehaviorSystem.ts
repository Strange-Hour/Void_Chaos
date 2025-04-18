import { System } from '@engine/ecs/System';
import { Entity } from '@engine/ecs/Entity';
import { AI } from '@engine/ecs/components/AI';
import { Transform } from '@engine/ecs/components/Transform';
import { CharacterController } from '@engine/ecs/components/CharacterController';
import { Vector2 } from '@engine/math/Vector2';
// Import pattern types
import {
  MovementPatternDefinition,
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
    const players: Entity[] = Array.from(this.entities).filter(entity =>
      entity.hasComponent('player') && entity.hasComponent('transform')
    );

    // Update targets if players exist
    if (players.length > 0) {
      this.updateAITargetsWithPlayers(players);
    }

    // Simplified loop - target update happens above now
    this.aiEntities.forEach(({ ai, transform, controller }) => {
      const target = ai.getTarget();
      const patternDef = ai.getCurrentPatternDefinition();

      // If no pattern or target is required but missing, default to idle
      if (!patternDef || (patternDef.targetType === 'player' && !target)) {
        controller.setMoveDirection({ x: 0, y: 0 }); // Idle
        controller.setAimDirection({ x: 1, y: 0 }); // Default aim forward
        ai.update(deltaTime); // Still update AI component internal timers etc.
        return;
      }

      // Calculate position, distance, direction (only if needed)
      const position = transform.getPosition();
      let distanceToTarget = 0;
      let directionToTarget: Vector2 = { x: 1, y: 0 }; // Default direction
      let targetPosition: Vector2 | null = null;

      if (target && patternDef.targetType === 'player') {
        targetPosition = target.position;
        distanceToTarget = this.getDistance(position, targetPosition);
        directionToTarget = this.getDirection(position, targetPosition);
      }

      // Apply movement based on the current pattern type
      switch (patternDef.type) {
        case 'chase':
          // Cast to specific type for type safety (optional but good practice)
          this.updateChaseState(controller, directionToTarget, patternDef as IChasePattern);
          break;
        case 'flank':
          if (targetPosition) { // Flank needs a target position
            this.updateFlankState(controller, position, targetPosition, directionToTarget, patternDef as IFlankPattern);
          }
          break;
        case 'retreat':
          if (targetPosition) { // Retreat needs a target position
            this.updateKeepDistanceState(controller, distanceToTarget, directionToTarget, patternDef as IRetreatPattern);
          }
          break;
        case 'idle':
        default:
          controller.setMoveDirection({ x: 0, y: 0 });
          break;
      }

      // Aiming logic (keep aiming at target if one exists)
      if (targetPosition) {
        controller.setAimDirection(directionToTarget);
      } else {
        // What should idle enemies aim at? Keep current or default?
        // controller.setAimDirection({ x: 1, y: 0 }); // Example: Default forward
      }

      // Update AI component (e.g., timers, internal state)
      ai.update(deltaTime);
    });
  }

  private updateChaseState(
    controller: CharacterController,
    directionToTarget: Vector2,
    patternDef: IChasePattern // Accept pattern definition
  ): void {
    // Simple chase behavior - move directly towards target
    // Could use patternDef parameters later (e.g., stopDistance)
    controller.setMoveDirection(directionToTarget);
  }

  private updateFlankState(
    controller: CharacterController,
    position: Vector2,
    targetPosition: Vector2,
    directionToTarget: Vector2,
    patternDef: IFlankPattern // Accept pattern definition
  ): void {
    // Use parameters from pattern definition
    const flankWeight = patternDef.flankWeight ?? 0.3; // Default if not specified
    // idealDistance and distanceMargin could be used here too if needed

    const perpendicularDir = { x: -directionToTarget.y, y: directionToTarget.x };
    const dotProduct = (position.x - targetPosition.x) * perpendicularDir.x +
      (position.y - targetPosition.y) * perpendicularDir.y;

    if (dotProduct < 0) {
      perpendicularDir.x = -perpendicularDir.x;
      perpendicularDir.y = -perpendicularDir.y;
    }

    // Combine flanking and approach directions using flankWeight
    const approachWeight = 1 - flankWeight;
    const moveDirection = {
      x: approachWeight * directionToTarget.x + flankWeight * perpendicularDir.x,
      y: approachWeight * directionToTarget.y + flankWeight * perpendicularDir.y
    };

    const magnitude = Math.sqrt(moveDirection.x * moveDirection.x + moveDirection.y * moveDirection.y);
    if (magnitude > 0) { // Avoid division by zero
      moveDirection.x /= magnitude;
      moveDirection.y /= magnitude;
    }

    controller.setMoveDirection(moveDirection);
  }

  private updateKeepDistanceState(
    controller: CharacterController,
    distanceToTarget: number,
    directionToTarget: Vector2,
    patternDef: IRetreatPattern // Accept pattern definition
  ): void {
    // Use parameters from pattern definition
    const optimalDistance = patternDef.idealDistance;
    const followThreshold = patternDef.followThreshold;
    // Use provided margin or a default
    const distanceMargin = patternDef.distanceMargin ?? 50;

    if (distanceToTarget < optimalDistance - distanceMargin) {
      // Too close, move away
      controller.setMoveDirection({ x: -directionToTarget.x, y: -directionToTarget.y });
    } else if (distanceToTarget > followThreshold) {
      // Too far (beyond follow threshold), move closer
      controller.setMoveDirection(directionToTarget);
    } else if (distanceToTarget > optimalDistance + distanceMargin) {
      // Within follow range but further than ideal+margin, gently move closer or strafe?
      // Original code strafed here if within optimal range, now we only retreat if too close.
      // Let's move closer if outside ideal range but within followThreshold.
      controller.setMoveDirection(directionToTarget);
    } else {
      // Within optimal range (idealDistance +/- distanceMargin), stop or strafe
      // Let's strafe for now
      controller.setMoveDirection({ x: -directionToTarget.y, y: directionToTarget.x });
      // Alternatively, stop moving: controller.setMoveDirection({ x: 0, y: 0 });
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

    if (distance === 0) return { x: 1, y: 0 }; // Default direction if overlapping

    return {
      x: dx / distance,
      y: dy / distance
    };
  }
} 