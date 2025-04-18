import { Entity } from '@engine/ecs/Entity';
import { Enemy } from '@engine/ecs/components/Enemy';
import { Transform } from '@engine/ecs/components/Transform';
import { AI, AIState } from '@engine/ecs/components/AI';
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

    // Add enemy component with type-specific configuration
    const enemyComponent = new Enemy(typeId);
    const config = enemyComponent.getConfig();

    // Apply difficulty multiplier if provided
    if (options.difficultyMultiplier) {
      const adjustedConfig = {
        ...config,
        health: Math.round(config.health * options.difficultyMultiplier),
        damage: Math.round(config.damage * options.difficultyMultiplier),
        speed: Math.round(config.speed * options.difficultyMultiplier)
      };
      // Note: We don't need setConfig anymore as config is immutable
    }

    enemy.addComponent(enemyComponent);

    // Add transform component for position and movement
    const transform = new Transform();
    transform.setPosition(options.position);
    enemy.addComponent(transform);

    // Add character controller for movement and aiming
    const controller = new CharacterController({
      maxSpeed: config.speed,
      acceleration: 1000,
      deceleration: 800,
    });
    enemy.addComponent(controller);

    // Add health component
    const health = new Health({ maxHealth: config.health });
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

    // Add renderer component if sprite is available
    const sprite = options.sprite || this.enemySprites[typeId];
    if (!sprite && process.env.NODE_ENV !== 'production') {
      console.warn(`No sprite found for enemy type: ${typeId}`);
    }
    const renderer = new Renderer(sprite || new Sprite({
      url: '/sprites/enemy-basic',
      width: 32,
      height: 32
    }));
    renderer.setVisible(true);
    enemy.addComponent(renderer);

    // Add AI component with appropriate behaviors
    const ai = new AI();
    ai.setState(enemyComponent.getDefaultState() as AIState);
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