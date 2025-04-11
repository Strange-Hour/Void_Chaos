import { Entity } from '../Entity';
import { Enemy, EnemyType } from '../components/Enemy';
import { Transform } from '../components/Transform';
import { AI } from '../components/AI';
import { Health } from '../components/Health';
import { Collider } from '../components/Collider';
import { Renderer } from '../components/Renderer';
import { Sprite } from '../../Sprite';

export interface EnemySpawnOptions {
  position: { x: number; y: number };
  type?: EnemyType;
  aiTarget?: { x: number; y: number; type: string };
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

    // Add health component with difficulty-adjusted health
    const config = enemyComponent.getConfig();
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
    if (sprite) {
      const renderer = new Renderer(sprite);
      enemy.addComponent(renderer);
    }

    // Add AI component with appropriate behaviors
    const ai = new AI();
    this.setupAIBehaviors(ai, type);
    if (options.aiTarget) {
      ai.setTarget({
        position: { x: options.aiTarget.x, y: options.aiTarget.y },
        type: options.aiTarget.type,
      });
    }
    enemy.addComponent(ai);

    return enemy;
  }

  /**
   * Sets up AI behaviors based on enemy type
   */
  private static setupAIBehaviors(ai: AI, type: EnemyType): void {
    switch (type) {
      case EnemyType.Basic:
        ai.addBehavior({
          name: 'chase',
          update: () => {
            // Basic chase behavior will be implemented in the AI system
          },
        });
        break;

      case EnemyType.Flanker:
        ai.addBehavior({
          name: 'flank',
          update: () => {
            // Flanking behavior will be implemented in the AI system
          },
        });
        break;

      case EnemyType.Ranged:
        ai.addBehavior({
          name: 'keepDistance',
          update: () => {
            // Ranged behavior will be implemented in the AI system
          },
        });
        ai.addBehavior({
          name: 'attack',
          update: () => {
            // Ranged attack behavior will be implemented in the AI system
          },
        });
        break;
    }

    // Add idle behavior for all enemy types
    ai.addBehavior({
      name: 'idle',
      update: () => {
        // Idle behavior will be implemented in the AI system
      },
    });

    // Set initial state
    ai.setState(type === EnemyType.Ranged ? 'keepDistance' : 'chase');
  }
} 