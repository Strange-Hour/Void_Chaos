/**
 * SpriteManager.ts
 * Handles sprite loading, caching, and performance optimizations
 */

import { Sprite, SpriteConfig } from './Sprite';

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
    console.log(`Getting sprite: ${url}`);
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
    console.log(`Queueing sprite: ${url} with priority: ${options.priority}`);
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

    console.log(`Processing queue. Current queue length: ${this.loadQueue.length}, Active loads: ${this.activeLoads}`);

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
              console.log(`Loading sprite: ${url}`);
              resolve();
            };
            img.onerror = () => {
              console.log(`Error loading sprite: ${url}`);
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

    console.log(`Finished processing queue. Remaining queue length: ${this.loadQueue.length}, Active loads: ${this.activeLoads}`);

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
} 