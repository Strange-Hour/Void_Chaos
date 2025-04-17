import { Entity } from '@engine/ecs/Entity';
import { Enemy, EnemyType } from '@engine/ecs/components/Enemy';
import { Transform } from '@engine/ecs/components/Transform';
import { AI } from '@engine/ecs/components/AI';
import { Health } from '@engine/ecs/components/Health';
import { Collider } from '@engine/ecs/components/Collider';
import { Renderer } from '@engine/ecs/components/Renderer';
import { Sprite } from '@engine/Sprite';
import { CharacterController } from '@engine/ecs/components/CharacterController';

export interface EnemySpawnOptions {
  position: { x: number; y: number };
  type?: EnemyType;
  aiTarget?: { x: number; y: number; entity?: Entity };
  sprite?: Sprite;
  difficultyMultiplier?: number;
}

/**
 * Factory class for creating enemy entities with appropriate components
 */
export class EnemyFactory {
  private static enemySprites: { [key in EnemyType]?: Sprite } = {};

  /**
   * Set the sprite for a specific enemy type
   */
  static setEnemySprite(type: EnemyType, sprite: Sprite): void {
    this.enemySprites[type] = sprite;
  }

  /**
   * Creates a new enemy entity with all required components
   */
  static createEnemy(options: EnemySpawnOptions): Entity {
    const enemy = new Entity();
    const type = options.type || EnemyType.Basic;

    // Add enemy component with type-specific configuration
    const enemyComponent = new Enemy(type);

    // Apply difficulty multiplier if provided
    if (options.difficultyMultiplier) {
      const config = enemyComponent.getConfig();
      enemyComponent.setConfig({
        ...config,
        health: Math.round(config.health * options.difficultyMultiplier),
        damage: Math.round(config.damage * options.difficultyMultiplier),
        speed: Math.round(config.speed * options.difficultyMultiplier)
      });
    }

    enemy.addComponent(enemyComponent);

    // Add transform component for position and movement
    const transform = new Transform();
    transform.setPosition(options.position);
    enemy.addComponent(transform);

    // Add character controller for movement and aiming
    const config = enemyComponent.getConfig();
    const controller = new CharacterController({
      maxSpeed: config.speed,
      acceleration: 1000,
      deceleration: 800,
    });
    enemy.addComponent(controller);

    // Add health component with difficulty-adjusted health
    const health = new Health({ maxHealth: config.health });
    enemy.addComponent(health);

    // Add collider component
    const collider = new Collider({
      width: 32, // Default size, can be adjusted per enemy type
      height: 32,
      offset: { x: -16, y: -16 }, // Center the collision box
    }, {
      isTrigger: false,
    });
    enemy.addComponent(collider);

    // Add renderer component if sprite is available
    const sprite = options.sprite || this.enemySprites[type];
    if (!sprite && process.env.NODE_ENV !== 'production') {
      console.warn(`No sprite found for enemy type: ${type}`);
    }
    const renderer = new Renderer(sprite || new Sprite({
      url: '/sprites/enemy-basic', // Fallback sprite with no extension
      width: 32,
      height: 32
    }));

    // Explicitly ensure the renderer is visible
    renderer.setVisible(true);

    enemy.addComponent(renderer);

    // Add AI component with appropriate behaviors
    const ai = new AI();
    this.setupAIBehaviors(ai, type);
    if (options.aiTarget) {
      ai.setTarget({
        position: { x: options.aiTarget.x, y: options.aiTarget.y },
        entity: options.aiTarget.entity
      });
    }
    enemy.addComponent(ai);

    return enemy;
  }

  /**
   * Sets up AI behaviors based on enemy type
   */
  private static setupAIBehaviors(ai: AI, type: EnemyType): void {
    // Set initial state based on enemy type
    switch (type) {
      case EnemyType.Basic:
        ai.setState('chase');
        break;

      case EnemyType.Flanker:
        ai.setState('chase'); // Flankers also chase but with different behavior
        break;

      case EnemyType.Ranged:
        ai.setState('retreat'); // Ranged enemies maintain distance
        break;

      default:
        ai.setState('idle');
    }
  }
} 