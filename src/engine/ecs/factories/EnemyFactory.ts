import { Entity } from '@engine/ecs/Entity';
import { Enemy } from '@engine/ecs/components/Enemy';
import { Transform } from '@engine/ecs/components/Transform';
import { AI } from '@engine/ecs/components/AI';
import { Health } from '@engine/ecs/components/Health';
import { Collider } from '@engine/ecs/components/Collider';
import { Renderer } from '@engine/ecs/components/Renderer';
import { Sprite } from '@engine/Sprite';
import { CharacterController } from '@engine/ecs/components/CharacterController';
import { EnemyRegistry } from '@engine/ecs/enemies/EnemyRegistry';

export interface EnemySpawnOptions {
  position: { x: number; y: number };
  typeId?: string;
  aiTarget?: { x: number; y: number; entity?: Entity };
  sprite?: Sprite;
  difficultyMultiplier?: number;
}

/**
 * Factory class for creating enemy entities with appropriate components
 */
export class EnemyFactory {
  private static enemySprites: { [key: string]: Sprite } = {};

  /**
   * Set the sprite for a specific enemy type
   */
  static setEnemySprite(typeId: string, sprite: Sprite): void {
    this.enemySprites[typeId] = sprite;
  }

  /**
   * Creates a new enemy entity with all required components
   */
  static createEnemy(options: EnemySpawnOptions): Entity {
    const enemy = new Entity();
    const typeId = options.typeId || 'basic';

    // Get the full definition from the registry
    const definition = EnemyRegistry.getInstance().getEnemyType(typeId);
    if (!definition) {
      console.error(`Failed to create enemy: Type definition not found for ID '${typeId}'`);
      // Return a minimal entity or throw an error?
      return enemy; // Returning an empty entity for now
    }

    // Use definition.config directly
    const config = definition.config;
    let effectiveConfig = { ...config }; // Start with base config

    // Apply difficulty multiplier if provided
    if (options.difficultyMultiplier && options.difficultyMultiplier !== 1) {
      effectiveConfig = {
        ...effectiveConfig,
        health: Math.round(config.health * options.difficultyMultiplier),
        damage: Math.round(config.damage * options.difficultyMultiplier),
        speed: Math.round(config.speed * options.difficultyMultiplier)
      };
    }

    // Add enemy component
    // Pass the potentially modified config if Enemy component uses it internally
    const enemyComponent = new Enemy(typeId); // Assuming Enemy constructor only needs typeId
    enemy.addComponent(enemyComponent);

    // Add transform component
    const transform = new Transform();
    transform.setPosition(options.position);
    enemy.addComponent(transform);

    // Add character controller using effective speed
    const controller = new CharacterController({
      maxSpeed: effectiveConfig.speed, // Use effective speed
      acceleration: 1000,
      deceleration: 800,
    });
    enemy.addComponent(controller);

    // Add health component using effective health
    const health = new Health({ maxHealth: effectiveConfig.health }); // Use effective health
    enemy.addComponent(health);

    // Add collider component
    const collider = new Collider({
      width: 32,
      height: 32,
      offset: { x: -16, y: -16 },
    }, {
      layer: 2,
      isTrigger: false,
    });
    enemy.addComponent(collider);

    // Add renderer component
    const sprite = options.sprite || this.enemySprites[typeId];
    if (!sprite && process.env.NODE_ENV !== 'production') {
      console.warn(`No sprite found for enemy type: ${typeId}`);
    }
    const renderer = new Renderer(sprite || new Sprite({
      url: '/sprites/enemy-basic.svg', // Fallback sprite
      width: 32,
      height: 32
    }));
    renderer.setVisible(true);
    enemy.addComponent(renderer);

    // Add AI component
    const ai = new AI();
    ai.setColor(definition.color);


    // Extract available patterns from movementStateMachine.states
    const stateMachine = definition.movementStateMachine;
    const patterns: Record<string, import('@engine/ecs/ai/patterns/types').MovementPatternDefinition> = {};
    if (stateMachine && Array.isArray(stateMachine.states)) {
      for (const state of stateMachine.states) {
        patterns[state.state] = state.pattern;
      }
    }
    ai.setAvailablePatterns(patterns);
    ai.setCurrentPatternId(stateMachine?.initial || null);


    // Set initial target if provided
    if (options.aiTarget) {
      ai.setTarget({
        position: { x: options.aiTarget.x, y: options.aiTarget.y },
        entity: options.aiTarget.entity
      });
    }
    enemy.addComponent(ai);

    return enemy;
  }
} 