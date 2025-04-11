/**
 * Sprite.ts
 * Handles image loading and rendering for game sprites
 */

export interface SpriteConfig {
  url: string;
  width?: number;
  height?: number;
}

export class Sprite {
  private image: HTMLImageElement;
  private isLoaded: boolean = false;
  private width: number = 0;
  private height: number = 0;

  constructor(config: SpriteConfig) {
    this.image = new Image();
    this.image.src = config.url;

    // Set initial dimensions if provided
    if (config.width) this.width = config.width;
    if (config.height) this.height = config.height;

    // Setup load handler
    this.image.onload = () => {
      this.isLoaded = true;
      // If dimensions weren't provided, use the natural image dimensions
      if (!config.width) this.width = this.image.naturalWidth;
      if (!config.height) this.height = this.image.naturalHeight;
    };

    // Setup error handler
    this.image.onerror = () => {
      console.error(`Failed to load sprite: ${config.url}`);
    };
  }

  /**
   * Draws the sprite on the given context
   */
  public draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    options: {
      width?: number;
      height?: number;
      sourceX?: number;
      sourceY?: number;
      sourceWidth?: number;
      sourceHeight?: number;
      rotation?: number;
      alpha?: number;
      flipX?: boolean;
      flipY?: boolean;
    } = {}
  ): void {
    if (!this.isLoaded) return;

    const {
      width = this.width,
      height = this.height,
      sourceX = 0,
      sourceY = 0,
      sourceWidth = this.width,
      sourceHeight = this.height,
      rotation = 0,
      alpha = 1,
      flipX = false,
      flipY = false
    } = options;

    // Save the current context state
    ctx.save();

    // Set transparency
    if (alpha !== 1) {
      ctx.globalAlpha = alpha;
    }

    // Handle rotation
    if (rotation !== 0) {
      ctx.translate(x + width / 2, y + height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-(x + width / 2), -(y + height / 2));
    }

    // Handle flipping
    if (flipX || flipY) {
      ctx.translate(flipX ? x + width : x, flipY ? y + height : y);
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      ctx.translate(flipX ? -x : 0, flipY ? -y : 0);
    }

    // Draw the sprite
    ctx.drawImage(
      this.image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      x,
      y,
      width,
      height
    );

    // Restore the context state
    ctx.restore();
  }

  /**
   * Checks if the sprite is loaded
   */
  public isReady(): boolean {
    return this.isLoaded;
  }

  /**
   * Gets the sprite dimensions
   */
  public getDimensions(): { width: number; height: number } {
    return {
      width: this.width,
      height: this.height
    };
  }

  /**
   * Gets the original image element
   */
  public getImage(): HTMLImageElement {
    return this.image;
  }
} 