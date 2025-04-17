import { System } from '../System';
import { Entity } from '../Entity';
import { Collider } from '../components/Collider';
import { Transform } from '../components/Transform';
import { World } from '../World';
import { Enemy } from '../components/Enemy';
import { Health } from '../components/Health';
import { CharacterController } from '../components/CharacterController';

export interface CollisionCallback {
  (entity1: Entity, entity2: Entity): void;
}

export interface CollisionPair {
  entity1Type: string;
  entity2Type: string;
  callback: CollisionCallback;
}

/**
 * System responsible for detecting and resolving collisions between entities
 */
export class CollisionSystem extends System {
  private world: World;
  private collisionMatrix: Map<number, Map<number, boolean>>;
  private collisionCallbacks: CollisionPair[];
  private entityCollisions: Map<number, Set<number>>;
  private newCollisions: Map<number, Set<number>>;
  private debug: boolean;
  private enablePositionResolution: boolean;
  private movementAdjustmentStrength: number;

  constructor(world: World) {
    // We need both collider and transform components
    super(['collider', 'transform']);
    this.world = world;
    this.collisionMatrix = new Map();
    this.collisionCallbacks = [];
    this.entityCollisions = new Map();
    this.newCollisions = new Map();
    this.debug = false;
    this.enablePositionResolution = true; // Enable by default
    this.movementAdjustmentStrength = 0.5; // Strength of push-back (0-1)

    // Register default collision handlers
    this.registerPlayerEnemyCollisions();

    console.log('CollisionSystem initialized with default player-enemy handlers');
  }

  /**
   * Enable or disable debug visualization
   */
  setDebug(enabled: boolean): void {
    this.debug = enabled;
  }

  /**
   * Enable or disable position resolution for solid collisions
   */
  setPositionResolution(enabled: boolean): void {
    this.enablePositionResolution = enabled;
    console.log(`Collision position resolution ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set the strength of collision resolution (0-1)
   * Higher values push entities apart more strongly
   */
  setResolutionStrength(strength: number): void {
    this.movementAdjustmentStrength = Math.min(Math.max(0, strength), 1);
    console.log(`Collision resolution strength set to ${this.movementAdjustmentStrength}`);
  }

  /**
   * Define which collision layers can interact with each other
   */
  setLayerCollision(layer1: number, layer2: number, canCollide: boolean): void {
    // Ensure the maps exist
    if (!this.collisionMatrix.has(layer1)) {
      this.collisionMatrix.set(layer1, new Map());
    }
    if (!this.collisionMatrix.has(layer2)) {
      this.collisionMatrix.set(layer2, new Map());
    }

    // Set collision rules (both ways)
    this.collisionMatrix.get(layer1)!.set(layer2, canCollide);
    this.collisionMatrix.get(layer2)!.set(layer1, canCollide);

    console.log(`Collision layer rule set: Layer ${layer1} and Layer ${layer2} can collide: ${canCollide}`);
  }

  /**
   * Register a callback for when entities of specific types collide
   */
  registerCollisionCallback(pair: CollisionPair): void {
    this.collisionCallbacks.push(pair);
    console.log(`Registered collision callback between '${pair.entity1Type}' and '${pair.entity2Type}'`);
  }

  /**
   * Register default collision handlers for player-enemy interactions
   */
  private registerPlayerEnemyCollisions(): void {
    this.registerCollisionCallback({
      entity1Type: 'player',
      entity2Type: 'enemy',
      callback: (player, enemy) => {
        // Handle player-enemy collision
        this.handlePlayerEnemyCollision(player, enemy);
      }
    });
  }

  /**
   * Handle collision between player and enemy
   */
  private handlePlayerEnemyCollision(playerEntity: Entity, enemyEntity: Entity): void {
    const enemy = enemyEntity.getComponent('enemy') as Enemy;

    // Handle damage application with a small cooldown
    const currentTime = performance.now();

    // Only process damage if the enemy can attack
    if (enemy.canAttack(currentTime)) {
      const damage = enemy.attack(currentTime);

      // Apply damage to player if they have a health component
      if (playerEntity.hasComponent('health')) {
        const health = playerEntity.getComponent('health') as Health;
        health.damage(damage);
        console.log(`COLLISION: Player took ${damage} damage from enemy ${enemyEntity.getId()}, health now: ${health.getCurrentHealth()}/${health.getMaxHealth()}`);
      } else {
        console.log(`COLLISION: Player-enemy collision detected but player has no health component`);
      }
    } else {
      console.log(`COLLISION: Player-enemy collision detected but enemy ${enemyEntity.getId()} can't attack yet (cooldown)`);
    }
  }

  /**
   * Check if two layers can collide
   */
  private canLayersCollide(layer1: number, layer2: number): boolean {
    const layer1Map = this.collisionMatrix.get(layer1);
    if (!layer1Map) return true; // Default to true if not specified

    return layer1Map.get(layer2) !== false; // Default to true if not explicitly set to false
  }

  /**
   * Update the collision system
   */
  update(): void {
    const entities = this.getEntities();
    this.newCollisions = new Map();

    // First pass: check all potential collisions
    for (let i = 0; i < entities.length; i++) {
      const entity1 = entities[i];
      const collider1 = entity1.getComponent('collider') as Collider;
      const transform1 = entity1.getComponent('transform') as Transform;
      const position1 = transform1.getPosition();
      const layer1 = collider1.getLayer();

      // Initialize collision tracking for this entity
      if (!this.newCollisions.has(entity1.getId())) {
        this.newCollisions.set(entity1.getId(), new Set());
      }

      // Skip static colliders against each other
      if (collider1.isStaticCollider()) {
        continue;
      }

      for (let j = i + 1; j < entities.length; j++) {
        const entity2 = entities[j];
        const collider2 = entity2.getComponent('collider') as Collider;
        const transform2 = entity2.getComponent('transform') as Transform;
        const position2 = transform2.getPosition();
        const layer2 = collider2.getLayer();

        // Check if these layers can collide
        if (!this.canLayersCollide(layer1, layer2)) {
          continue;
        }

        // Skip static colliders against each other
        if (collider1.isStaticCollider() && collider2.isStaticCollider()) {
          continue;
        }

        // Check for collision
        if (collider1.intersects(collider2, position1, position2)) {
          // Log collision detection with entity types
          const entity1Type = this.getEntityTypeString(entity1);
          const entity2Type = this.getEntityTypeString(entity2);
          console.log(`COLLISION DETECTED: ${entity1Type} (${entity1.getId()}) with ${entity2Type} (${entity2.getId()})`);

          // Record the collision
          this.newCollisions.get(entity1.getId())!.add(entity2.getId());

          // Initialize collision tracking for entity2 if needed
          if (!this.newCollisions.has(entity2.getId())) {
            this.newCollisions.set(entity2.getId(), new Set());
          }
          this.newCollisions.get(entity2.getId())!.add(entity1.getId());

          // Trigger collision response
          this.handleCollision(entity1, entity2);

          // Resolve positions if enabled
          if (this.enablePositionResolution) {
            if (!collider1.isTriggerCollider() && !collider2.isTriggerCollider()) {
              this.resolveCollisionPositions(entity1, entity2, position1, position2, collider1, collider2);
            }
          }
        }
      }
    }

    // Update tracking for enter/exit events next frame
    this.entityCollisions = this.newCollisions;
  }

  /**
   * Resolve collision by adjusting entity positions
   */
  private resolveCollisionPositions(
    entity1: Entity,
    entity2: Entity,
    position1: { x: number, y: number },
    position2: { x: number, y: number },
    collider1: Collider,
    collider2: Collider
  ): void {
    // Calculate collision overlap
    const bounds1 = collider1.getBounds();
    const bounds2 = collider2.getBounds();

    // Calculate the edges of each entity's collision box
    const entity1Left = position1.x + bounds1.offset.x;
    const entity1Right = entity1Left + bounds1.width;
    const entity1Top = position1.y + bounds1.offset.y;
    const entity1Bottom = entity1Top + bounds1.height;

    const entity2Left = position2.x + bounds2.offset.x;
    const entity2Right = entity2Left + bounds2.width;
    const entity2Top = position2.y + bounds2.offset.y;
    const entity2Bottom = entity2Top + bounds2.height;

    // Calculate overlap on each axis
    const overlapX = Math.min(entity1Right - entity2Left, entity2Right - entity1Left);
    const overlapY = Math.min(entity1Bottom - entity2Top, entity2Bottom - entity1Top);

    // Determine which axis has less overlap
    let moveX = 0;
    let moveY = 0;

    if (overlapX < overlapY) {
      // Resolve along X axis
      if (position1.x < position2.x) {
        moveX = -overlapX;
      } else {
        moveX = overlapX;
      }
    } else {
      // Resolve along Y axis
      if (position1.y < position2.y) {
        moveY = -overlapY;
      } else {
        moveY = overlapY;
      }
    }

    // Adjust movement based on entity characteristics
    const isEntity1Player = entity1.hasComponent('player');
    const isEntity2Player = entity2.hasComponent('player');
    const isEntity1Static = collider1.isStaticCollider();
    const isEntity2Static = collider2.isStaticCollider();

    const transform1 = entity1.getComponent('transform') as Transform;
    const transform2 = entity2.getComponent('transform') as Transform;

    // Calculate how much each entity should move
    let entity1MoveX = 0;
    let entity1MoveY = 0;
    let entity2MoveX = 0;
    let entity2MoveY = 0;

    // If one entity is static, the other entity should move fully
    if (isEntity1Static) {
      entity2MoveX = -moveX;
      entity2MoveY = -moveY;
    } else if (isEntity2Static) {
      entity1MoveX = moveX;
      entity1MoveY = moveY;
    }
    // If player is involved, bias movement toward non-player
    else if (isEntity1Player) {
      // Player should move less, enemy more
      entity1MoveX = moveX * 0.3;
      entity1MoveY = moveY * 0.3;
      entity2MoveX = -moveX * 0.7;
      entity2MoveY = -moveY * 0.7;
    } else if (isEntity2Player) {
      // Player should move less, enemy more
      entity1MoveX = moveX * 0.7;
      entity1MoveY = moveY * 0.7;
      entity2MoveX = -moveX * 0.3;
      entity2MoveY = -moveY * 0.3;
    }
    // Default case - both entities move equally
    else {
      entity1MoveX = moveX * 0.5;
      entity1MoveY = moveY * 0.5;
      entity2MoveX = -moveX * 0.5;
      entity2MoveY = -moveY * 0.5;
    }

    // Apply movement adjustment strength
    entity1MoveX *= this.movementAdjustmentStrength;
    entity1MoveY *= this.movementAdjustmentStrength;
    entity2MoveX *= this.movementAdjustmentStrength;
    entity2MoveY *= this.movementAdjustmentStrength;

    // Apply calculated movement
    if (!isEntity1Static) {
      const newPos1 = {
        x: position1.x + entity1MoveX,
        y: position1.y + entity1MoveY
      };
      transform1.setPosition(newPos1);

      // Also adjust velocity if entity has a character controller
      if (entity1.hasComponent('character-controller')) {
        const controller = entity1.getComponent('character-controller') as CharacterController;
        // Dampen velocity on the collision axis by manipulating direction instead
        const moveDir = controller.getMoveDirection();
        if (Math.abs(entity1MoveX) > Math.abs(entity1MoveY)) {
          // Reverse X direction partially to create bounce effect
          controller.setMoveDirection({
            x: moveDir.x * -0.3, // Reverse and reduce movement
            y: moveDir.y
          });
        } else {
          // Reverse Y direction partially to create bounce effect
          controller.setMoveDirection({
            x: moveDir.x,
            y: moveDir.y * -0.3 // Reverse and reduce movement
          });
        }
      }
    }

    if (!isEntity2Static) {
      const newPos2 = {
        x: position2.x + entity2MoveX,
        y: position2.y + entity2MoveY
      };
      transform2.setPosition(newPos2);

      // Also adjust velocity if entity has a character controller
      if (entity2.hasComponent('character-controller')) {
        const controller = entity2.getComponent('character-controller') as CharacterController;
        // Dampen velocity on the collision axis by manipulating direction instead
        const moveDir = controller.getMoveDirection();
        if (Math.abs(entity2MoveX) > Math.abs(entity2MoveY)) {
          // Reverse X direction partially to create bounce effect
          controller.setMoveDirection({
            x: moveDir.x * -0.3, // Reverse and reduce movement
            y: moveDir.y
          });
        } else {
          // Reverse Y direction partially to create bounce effect
          controller.setMoveDirection({
            x: moveDir.x,
            y: moveDir.y * -0.3 // Reverse and reduce movement
          });
        }
      }
    }

    if (this.debug) {
      console.log(`COLLISION RESOLUTION: Moved entity ${entity1.getId()} by (${entity1MoveX.toFixed(2)}, ${entity1MoveY.toFixed(2)}) and entity ${entity2.getId()} by (${entity2MoveX.toFixed(2)}, ${entity2MoveY.toFixed(2)})`);
    }
  }

  /**
   * Get a descriptive string for an entity to improve logging
   */
  private getEntityTypeString(entity: Entity): string {
    if (entity.hasComponent('player')) return 'Player';
    if (entity.hasComponent('enemy')) return 'Enemy';
    return 'Entity';
  }

  /**
   * Handle collision between two entities
   */
  private handleCollision(entity1: Entity, entity2: Entity): void {
    // Find applicable callbacks
    let callbackTriggered = false;

    for (const pair of this.collisionCallbacks) {
      // Check both combinations (entity1=type1, entity2=type2) and (entity1=type2, entity2=type1)
      if (
        (entity1.hasComponent(pair.entity1Type) && entity2.hasComponent(pair.entity2Type)) ||
        (entity1.hasComponent(pair.entity2Type) && entity2.hasComponent(pair.entity1Type))
      ) {
        callbackTriggered = true;
        console.log(`COLLISION CALLBACK: Triggering callback for ${pair.entity1Type}-${pair.entity2Type} collision`);

        // Make sure entity1 is of entity1Type for the callback
        if (entity1.hasComponent(pair.entity1Type) && entity2.hasComponent(pair.entity2Type)) {
          pair.callback(entity1, entity2);
        } else {
          pair.callback(entity2, entity1);
        }
      }
    }

    if (!callbackTriggered) {
      console.log(`COLLISION: No callback registered for collision between entities ${entity1.getId()} and ${entity2.getId()}`);
    }
  }
} 