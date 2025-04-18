/**
 * SpriteManager.ts
 * Handles sprite loading, caching, and performance optimizations
 */

import { Sprite, SpriteConfig } from './Sprite';
import { EnemyFactory } from './ecs/factories/EnemyFactory';
import { EnemyRegistry } from './ecs/enemies/EnemyRegistry';

interface SpriteCache {
  [key: string]: Sprite;
}

interface SpriteLoadOptions {
  preload?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

export class SpriteManager {
  private cache: SpriteCache = {};
  private loadQueue: { url: string; options: SpriteLoadOptions }[] = [];
  private isProcessingQueue: boolean = false;
  private maxConcurrentLoads: number = 5;
  private activeLoads: number = 0;

  constructor() {
    // Start processing the queue when created
    this.processQueue();
  }

  /**
   * Gets or creates a sprite
   */
  public getSprite(url: string, config?: Partial<SpriteConfig>, options: SpriteLoadOptions = {}): Sprite {
    // Return cached sprite if available
    if (this.cache[url]) {
      return this.cache[url];
    }

    // Create new sprite
    const sprite = new Sprite({ url, ...config });
    this.cache[url] = sprite;

    // Add to load queue if not preloaded
    if (!options.preload) {
      this.queueLoad(url, options);
    }

    return sprite;
  }

  /**
   * Preloads a list of sprites
   */
  public preload(configs: (SpriteConfig & SpriteLoadOptions)[]): Promise<void[]> {
    const loadPromises = configs.map(config => {
      return new Promise<void>((resolve, reject) => {
        const sprite = this.getSprite(config.url, config, { preload: true, ...config });
        const img = sprite.getImage();

        if (sprite.isReady()) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load sprite: ${config.url}`));
        }
      });
    });

    return Promise.all(loadPromises);
  }

  /**
   * Queues a sprite for loading
   */
  private queueLoad(url: string, options: SpriteLoadOptions = {}): void {

    // Add to queue based on priority
    const index = options.priority === 'high' ? 0 : this.loadQueue.length;
    this.loadQueue.splice(index, 0, { url, options });

    // Start processing if not already running
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  /**
   * Processes the load queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.loadQueue.length === 0) return;

    this.isProcessingQueue = true;


    while (this.loadQueue.length > 0 && this.activeLoads < this.maxConcurrentLoads) {
      const { url } = this.loadQueue.shift()!;
      this.activeLoads++;

      try {
        await new Promise<void>((resolve, reject) => {
          const sprite = this.cache[url];
          if (!sprite) {
            reject(new Error(`Sprite not found in cache: ${url}`));
            return;
          }

          const img = sprite.getImage();
          if (sprite.isReady()) {
            resolve();
          } else {
            img.onload = () => {
              resolve();
            };
            img.onerror = () => {
              reject(new Error(`Failed to load sprite: ${url}`));
            };
          }
        });
      } catch (error) {
        console.error(error);
      }

      this.activeLoads--;
    }

    this.isProcessingQueue = false;


    // Continue processing if there are more items in the queue
    if (this.loadQueue.length > 0) {
      this.processQueue();
    }
  }

  /**
   * Clears unused sprites from the cache
   */
  public clearUnused(usedUrls: string[]): void {
    Object.keys(this.cache).forEach(url => {
      if (!usedUrls.includes(url)) {
        delete this.cache[url];
      }
    });
  }

  /**
   * Gets the number of cached sprites
   */
  public getCacheSize(): number {
    return Object.keys(this.cache).length;
  }

  /**
   * Gets the number of sprites in the load queue
   */
  public getQueueLength(): number {
    return this.loadQueue.length;
  }

  /**
   * Sets the maximum number of concurrent loads
   */
  public setMaxConcurrentLoads(max: number): void {
    this.maxConcurrentLoads = Math.max(1, max);
  }

  /**
   * Preloads essential game sprites
   */
  public static preloadEssentialSprites(): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preloading essential game sprites...');
    }

    // Define essential sprites - without file extensions to allow format fallback
    const essentialSprites = [
      { url: '/sprites/player', width: 32, height: 32 },
      { url: '/sprites/enemy-basic', width: 32, height: 32 },
      { url: '/sprites/enemy-flanker', width: 32, height: 32 },
      { url: '/sprites/enemy-ranged', width: 32, height: 32 },
    ];

    // Create sprite instances
    const sprites = essentialSprites.map(config => new Sprite(config));

    // Log paths for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preloading sprites:', essentialSprites.map(s => s.url));
    }

    // Force load all sprites with a longer timeout
    return Promise.all(sprites.map(sprite =>
      sprite.forceLoad(15000)
        .catch(err => {
          console.error(`Failed to preload sprite ${sprite.getUrl()}:`, err);
          // Continue despite error
          return Promise.resolve();
        })
    ))
      .then(() => {
        if (process.env.NODE_ENV !== 'production') {
          console.log('Essential sprites preloaded successfully');
        }
        return Promise.resolve();
      })
      .catch(err => {
        console.error('Error during sprite preloading:', err);
        // Continue despite errors
        return Promise.resolve();
      });
  }

  /**
   * Preloads all enemy sprites based on registered enemy types
   */
  public static async preloadEnemySprites(): Promise<void> {
    const registry = EnemyRegistry.getInstance();
    const enemyTypes = registry.getAllEnemyTypes();

    if (process.env.NODE_ENV !== 'production') {
      console.log('Preloading enemy sprites...');
    }

    const loadPromises = enemyTypes.map(async enemyType => {
      const sprite = new Sprite({
        url: `/sprites/enemy-${enemyType.id}`,
        width: 32,
        height: 32
      });

      try {
        // Force load the sprite with a 15 second timeout
        await sprite.forceLoad(15000);

        // Set the sprite in the EnemyFactory
        EnemyFactory.setEnemySprite(enemyType.id, sprite);

        if (process.env.NODE_ENV !== 'production') {
          console.log(`- Loaded sprite for enemy type: ${enemyType.id}`);
        }
      } catch (error) {
        console.error(`Failed to load sprite for enemy type ${enemyType.id}:`, error);
      }
    });

    await Promise.all(loadPromises);
  }

  /**
   * Checks if all enemy sprites are loaded and logs their status
   */
  public static checkEnemySpritesLoaded(): boolean {
    const registry = EnemyRegistry.getInstance();
    const enemyTypes = registry.getAllEnemyTypes();
    let allLoaded = true;

    if (process.env.NODE_ENV !== 'production') {
      console.log('Checking enemy sprite loading status:');
    }

    // Check each enemy type
    enemyTypes.forEach(enemyType => {
      // Get sprite directly from EnemyFactory without creating an entity
      const sprite = this.getEnemySpriteForType(enemyType.id);
      const isLoaded = sprite?.isReady() || false;

      if (process.env.NODE_ENV !== 'production') {
        console.log(`- Enemy type ${enemyType.id}: ${isLoaded ? 'LOADED' : 'NOT LOADED'}`);
      }

      if (!isLoaded) {
        allLoaded = false;
      }
    });

    return allLoaded;
  }

  /**
   * Gets the sprite for a specific enemy type from the EnemyFactory
   */
  private static getEnemySpriteForType(typeId: string): Sprite | undefined {
    // Access the sprite directly from EnemyFactory's static cache
    // @ts-expect-error - Accessing private static property
    return EnemyFactory.enemySprites[typeId];
  }
} 