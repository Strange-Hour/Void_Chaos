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
  private loadAttempts: number = 0;
  private readonly maxLoadAttempts: number = 3;
  private url: string;

  constructor(config: SpriteConfig) {
    // Ensure sprite path is absolute
    this.url = config.url.startsWith('/') ? config.url : '/' + config.url;

    // Always try SVG format first (preferred for vector graphics)
    if (!this.url.endsWith('.svg') && !this.url.endsWith('.png')) {
      // If no extension, explicitly use SVG
      this.url = this.url + '.svg';
    }

    this.image = new Image();

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
      // If we tried a URL without extension and that failed, try explicit SVG
      if (!this.url.endsWith('.svg') && !this.url.endsWith('.png')) {
        const svgUrl = this.url + '.svg';
        this.url = svgUrl;
        this.image.src = svgUrl;
        return;
      }

      this.loadAttempts++;
      if (this.loadAttempts < this.maxLoadAttempts) {
        // Add cache-busting parameter and delay
        setTimeout(() => {
          this.image.src = this.url.split('?')[0] + `?retry=${Date.now()}`;
        }, 500 * this.loadAttempts); // Increase delay with each attempt
      }
    };

    // Start loading the image with cache buster to ensure fresh load
    this.image.src = this.url + `?t=${Date.now()}`;
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
      debug?: boolean;
    } = {}
  ): void {
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
      flipY = false,
      debug = false
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

    try {
      // Check if image is actually loaded before drawing it
      if (this.isLoaded && this.image.complete && this.image.naturalWidth > 0) {
        if (debug) {
          console.log(`Drawing sprite: ${this.url} at (${x}, ${y}) with dimensions ${width}x${height}`);
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

        if (debug) {
          // Add debug border to show the sprite bounds
          ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, width, height);
        }
      } else {
        // Draw a fallback colored rectangle if sprite isn't loaded
        console.warn(`Drawing fallback for sprite: ${this.url}, loaded: ${this.isLoaded}, complete: ${this.image.complete}, width: ${this.image.naturalWidth}, attempts: ${this.loadAttempts}`);

        // Fallback rendering - draw a colored rectangle
        ctx.fillStyle = this.getFallbackColor();
        ctx.fillRect(x, y, width, height);

        // Draw a border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Add a "!" to indicate not loaded
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText('!', x + width / 2 - 4, y + height / 2 + 4);

        // Add the filename for debugging
        const filename = this.url.split('/').pop() || '';
        if (filename) {
          ctx.font = '10px Arial';
          ctx.fillText(filename, x + 2, y + height - 4, width - 4);
        }

        // Attempt to force load the image
        if (!this.isLoaded) {
          this.forceLoadImage();
        }
      }
    } catch (err) {
      console.error('Error drawing sprite:', err);

      // Draw an error indicator
      ctx.fillStyle = 'red';
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.fillText('X', x + width / 2 - 4, y + height / 2 + 4);
    }

    // Restore the context state
    ctx.restore();
  }

  /**
   * Gets a color based on the sprite URL for fallback rendering
   */
  private getFallbackColor(): string {
    // Generate a deterministic color based on the sprite URL
    const url = this.url;

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      hash = ((hash << 5) - hash) + url.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }

    // Convert hash to color
    const r = (hash & 0xFF0000) >> 16;
    const g = (hash & 0x00FF00) >> 8;
    const b = hash & 0x0000FF;

    return `rgb(${Math.abs(r)}, ${Math.abs(g)}, ${Math.abs(b)})`;
  }

  /**
   * Force load the image immediately
   */
  private forceLoadImage(): void {
    // Only try to force load if not already loading
    if (!this.image.complete && this.loadAttempts < this.maxLoadAttempts) {
      this.loadAttempts++;

      // Create a new image element
      const newImage = new Image();

      // Set up handlers first
      newImage.onload = () => {
        this.isLoaded = true;
        this.image = newImage;
      };

      newImage.onerror = () => {
        console.error('Failed to force-load:', this.url);
      };

      // Attempt to load with cache-busting
      const cacheBuster = '?cb=' + Date.now();
      newImage.src = this.url.split('?')[0] + cacheBuster;
    }
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

  /**
   * Gets the sprite URL
   */
  public getUrl(): string {
    return this.url;
  }

  /**
   * Force loads a sprite with a promise and optional timeout
   */
  public forceLoad(timeoutMs: number = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      // If already loaded, resolve immediately
      if (this.isLoaded) {
        resolve();
        return;
      }

      // Set up a timeout
      const timeout = setTimeout(() => {
        reject(new Error(`Timed out loading sprite: ${this.url}`));
      }, timeoutMs);

      // Store original handlers
      const handleLoad = () => {
        // Clear timeout and resolve
        clearTimeout(timeout);
        this.isLoaded = true;
        resolve();
      };

      const handleError = () => {
        // Clear timeout and reject
        clearTimeout(timeout);

        // Try with full URL path
        const fullPath = window.location.origin + this.url;
        if (!this.url.includes(window.location.origin)) {
          this.image.removeEventListener('load', handleLoad);
          this.image.removeEventListener('error', handleError);

          this.url = fullPath;

          // One-time handlers for this final attempt
          this.image.onload = () => {
            clearTimeout(timeout);
            this.isLoaded = true;
            resolve();
          };

          this.image.onerror = () => {
            clearTimeout(timeout);
            reject(new Error(`Failed to load sprite: ${this.url}`));
          };

          // Try loading with full URL
          this.image.src = fullPath;
          return;
        }

        reject(new Error(`Failed to load sprite: ${this.url}`));
      };

      // Set up event listeners
      this.image.addEventListener('load', handleLoad);
      this.image.addEventListener('error', handleError);

      // Force reload with cache buster
      const src = this.url;
      this.image.src = '';
      setTimeout(() => {
        const cacheBuster = `?reload=${Date.now()}`;
        this.image.src = src.split('?')[0] + cacheBuster;
      }, 50);
    });
  }
} 