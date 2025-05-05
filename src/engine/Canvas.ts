/**
 * Canvas.ts
 * Handles canvas initialization, scaling, and basic rendering setup
 */

import { Layer, LayerConfig } from './Layer';
import { Camera, CameraConfig } from './Camera';
import { SpriteManager } from './SpriteManager';
import { LayerName, getLayerLevel, getLayerConfig } from '@/config';

interface CanvasConfig {
  width: number;
  height: number;
  containerId?: string;
  pixelRatio?: number;
  backgroundColor?: string;
  camera?: Partial<CameraConfig>;
  targetFPS?: number;
}

interface RenderStats {
  fps: number;
  frameTime: number;
  frameCount: number;
  lastFpsUpdate: number;
}

type RenderCallback = (deltaTime: number) => void;

export class Canvas {
  private container: HTMLElement | null = null;
  private pixelRatio: number = 1;
  private width: number = 0;
  private height: number = 0;
  private backgroundColor: string = '#000000';
  private layers: Map<string, Layer> = new Map();
  private containerElement: HTMLDivElement;
  private camera: Camera;
  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private animationFrameId: number = 0;
  private renderCallbacks: Set<RenderCallback> = new Set();
  private targetFPS: number = 60;
  private minFrameTime: number = 1000 / 60;
  private renderStats: RenderStats = {
    fps: 0,
    frameTime: 0,
    frameCount: 0,
    lastFpsUpdate: 0
  };
  private spriteManager: SpriteManager;
  private scale: number = 1;

  constructor(config: CanvasConfig) {
    // Initialize required properties that need complex setup
    this.containerElement = document.createElement('div');
    this.camera = new Camera({
      width: 0,
      height: 0
    });
    this.spriteManager = new SpriteManager();

    // Guard against server-side rendering
    if (typeof window === 'undefined') {
      return;
    }

    // Client-side initialization
    this.width = config.width;
    this.height = config.height;
    this.pixelRatio = config.pixelRatio || window.devicePixelRatio || 1;
    this.backgroundColor = config.backgroundColor || '#000000';
    this.targetFPS = config.targetFPS || 60;
    this.minFrameTime = 1000 / this.targetFPS;
    this.scale = this.pixelRatio;

    // Setup container element
    this.containerElement = document.createElement('div');
    this.containerElement.style.position = 'absolute';
    this.containerElement.style.width = '100%';
    this.containerElement.style.height = '100%';
    this.containerElement.style.backgroundColor = this.backgroundColor;
    this.containerElement.style.overflow = 'hidden';
    this.containerElement.style.top = '0';
    this.containerElement.style.left = '0';

    // Setup container with retry
    const maxRetries = 10;
    const retryInterval = 100; // ms
    let retryCount = 0;

    const trySetupContainer = () => {
      if (config.containerId) {
        this.container = document.getElementById(config.containerId);
        if (!this.container) {
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(trySetupContainer, retryInterval);
            return;
          }
          throw new Error(`Container with id "${config.containerId}" not found after ${maxRetries} attempts`);
        }
        this.container.appendChild(this.containerElement);
      } else {
        document.body.appendChild(this.containerElement);
        this.container = document.body;
      }

      // Initialize camera with actual dimensions
      this.camera = new Camera({
        width: this.width,
        height: this.height,
        ...config.camera
      });

      // Create default background layer
      this.createLayer(LayerName.Background, { zIndex: getLayerLevel(LayerName.Background) });

      // Initialize sprite manager
      this.spriteManager = new SpriteManager();

      this.handleResize = this.handleResize.bind(this);
      this.renderLoop = this.renderLoop.bind(this);
      window.addEventListener('resize', this.handleResize);
    };

    trySetupContainer();
  }

  /**
   * Starts the render loop
   */
  public start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastFrameTime = performance.now();
      this.renderStats.lastFpsUpdate = this.lastFrameTime;
      // Check isRunning again before starting the loop, in case stop() was called immediately
      if (this.isRunning) {
        this.animationFrameId = requestAnimationFrame(this.renderLoop);
      }
    } else {
      console.warn("Canvas loop already running. Ignoring start() call.");
    }
  }

  /**
   * Stops the render loop
   */
  public stop(): void {
    if (this.isRunning) {
      this.isRunning = false;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = 0; // Explicitly clear the ID
      }
    }
  }

  /**
   * Adds a render callback
   */
  public addRenderCallback(callback: RenderCallback): void {
    this.renderCallbacks.add(callback);
  }

  /**
   * Removes a render callback
   */
  public removeRenderCallback(callback: RenderCallback): void {
    this.renderCallbacks.delete(callback);
  }

  /**
   * The main render loop
   */
  private renderLoop(currentTime: number = performance.now()): void {
    // Immediate check upon entering the loop function
    if (!this.isRunning) {
      this.animationFrameId = 0; // Ensure ID is cleared if stop was called mid-frame
      return;
    }

    // Request the next frame *before* processing the current one
    // Only request if we are still running
    if (this.isRunning) {
      this.animationFrameId = requestAnimationFrame(this.renderLoop);
    }

    // Calculate frame timing
    const deltaTime = currentTime - this.lastFrameTime;

    // Skip frame if we're running too fast
    if (deltaTime < this.minFrameTime) {
      return;
    }

    // Update timing stats
    this.lastFrameTime = currentTime;
    this.renderStats.frameTime = deltaTime;
    this.renderStats.frameCount++;

    // Update FPS counter every second
    if (currentTime - this.renderStats.lastFpsUpdate >= 1000) {
      this.renderStats.fps = Math.round((this.renderStats.frameCount * 1000) / (currentTime - this.renderStats.lastFpsUpdate));
      this.renderStats.frameCount = 0;
      this.renderStats.lastFpsUpdate = currentTime;
    }

    // Execute render callbacks
    Array.from(this.renderCallbacks).forEach(callback => {
      try {
        // Final check before executing potentially heavy callbacks
        if (!this.isRunning) return;
        callback(deltaTime);
      } catch (error) {
        console.error('Error in render callback:', error);
      }
    });
  }

  /**
   * Gets the current render statistics
   */
  public getRenderStats(): Readonly<RenderStats> {
    return { ...this.renderStats };
  }

  /**
   * Sets the target FPS
   */
  public setTargetFPS(fps: number): void {
    this.targetFPS = Math.max(1, fps);
    this.minFrameTime = 1000 / this.targetFPS;
  }

  /**
   * Creates a new layer with the given name and configuration
   */
  public createLayer(name: LayerName, config: Partial<LayerConfig> = {}): Layer {
    if (this.layers.has(name)) {
      console.warn(`Layer ${name} already exists. Returning existing layer.`);
      return this.layers.get(name)!;
    }

    const layerConfig = getLayerConfig(name);
    const layer = new Layer({
      name,
      zIndex: config.zIndex ?? layerConfig.level,
      isVisible: config.isVisible
    });

    // Set dimensions after creation
    layer.setDimensions(this.width, this.height, this.scale);

    this.layers.set(name, layer);
    this.sortLayers();

    return layer;
  }

  private sortLayers(): void {
    // Remove all existing canvases from container
    while (this.containerElement.firstChild) {
      this.containerElement.removeChild(this.containerElement.firstChild);
    }

    // Sort layers by z-index and append to container
    const sortedLayers = Array.from(this.layers.values())
      .sort((a, b) => a.getZIndex() - b.getZIndex());

    for (const layer of sortedLayers) {
      if (layer.isLayerVisible()) {
        this.containerElement.appendChild(layer.getCanvas());
      }
    }
  }

  /**
   * Gets a layer by name
   */
  public getLayer(name: string): Layer | undefined {
    return this.layers.get(name);
  }

  /**
   * Removes a layer by name
   */
  public removeLayer(name: string): boolean {
    const layer = this.layers.get(name);
    if (layer) {
      layer.getCanvas().remove();
      return this.layers.delete(name);
    }
    return false;
  }

  /**
   * Clears all layers
   */
  public clear(): void {
    this.layers.forEach(layer => layer.clear());
  }

  /**
   * Handles window resize events
   */
  private handleResize = (): void => {
    const { width, height } = this.containerElement.getBoundingClientRect();
    this.width = width;
    this.height = height;

    // Update all layers with new dimensions
    this.layers.forEach(layer => {
      layer.setDimensions(width, height, this.scale);
    });
  };

  /**
   * Gets the current canvas dimensions
   */
  public getDimensions(): { width: number; height: number } {
    return {
      width: this.width,
      height: this.height
    };
  }

  /**
   * Gets all layer names
   */
  public getLayerNames(): string[] {
    return Array.from(this.layers.keys());
  }

  /**
   * Gets the camera instance
   */
  public getCamera(): Camera {
    return this.camera;
  }

  /**
   * Applies camera transformations to a rendering context
   */
  public applyCameraTransform(ctx: CanvasRenderingContext2D): void {
    const viewport = this.camera.getViewport();
    ctx.save();
    ctx.scale(viewport.zoom, viewport.zoom);
    ctx.translate(-viewport.x, -viewport.y);
  }

  /**
   * Removes camera transformations from a rendering context
   */
  public removeCameraTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  /**
   * Gets the sprite manager instance
   */
  public getSpriteManager(): SpriteManager {
    return this.spriteManager;
  }

  /**
   * Preloads a list of sprites
   */
  public preloadSprites(urls: string[]): Promise<void[]> {
    return this.spriteManager.preload(urls.map(url => ({ url })));
  }

  /**
   * Cleanup method to remove event listeners and elements
   */
  public destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    this.layers.forEach((_, name) => this.removeLayer(name));
    this.containerElement.remove();

    // Clear sprite cache
    this.spriteManager.clearUnused([]);
  }

  /**
   * Get the canvas width
   */
  public getWidth(): number {
    return this.width;
  }

  /**
   * Get the canvas height
   */
  public getHeight(): number {
    return this.height;
  }

  /**
   * Draw debug rectangle for diagnostics
   */
  public drawDebugRect(): void {
    // Get the background layer for debug drawing
    const layer = this.getLayer('background');
    if (!layer) {
      console.error('Cannot draw debug rect: background layer not found');
      return;
    }

    const ctx = layer.getContext();

    // Draw framed debug rectangle
    ctx.save();

    // Draw background
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(200, 150, 150, 150);

    // Draw frame
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 4;
    ctx.strokeRect(200, 150, 150, 150);

    // Draw text
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Debug Rectangle', 210, 220);

    // Draw FPS counter
    ctx.fillText(`Frame: ${this.renderStats.frameCount}`, 210, 250);
    ctx.fillText(`FPS: ${this.renderStats.fps}`, 210, 270);

    ctx.restore();

    // Test SVG rendering directly
    this.testSvgRendering();
  }

  /**
   * Test SVG rendering directly on canvas
   */
  private testSvgRendering(): void {
    // First, create all SVG elements in memory to ensure they're loaded
    const svgElements: HTMLImageElement[] = [];
    const svgUrls = [
      '/sprites/player.svg',
      '/sprites/enemy-basic.svg',
      '/sprites/enemy-flanker.svg',
      '/sprites/enemy-ranged.svg',
      '/sprites/enemy-bomber.svg'
    ];

    // Create and load all images
    svgUrls.forEach(url => {
      const img = new Image();
      img.src = url;
      svgElements.push(img);
    });

    // Get the background layer for debug drawing
    const layer = this.getLayer('background');
    if (!layer) {
      return;
    }

    const ctx = layer.getContext();

    // Wait for images to load and draw them
    svgElements.forEach((img, index) => {
      img.onload = () => {
        // Position of the SVG
        const x = 50 + index * 60;
        const y = 400;

        // Draw background
        ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
        ctx.fillRect(x - 2, y - 2, 36, 36);

        // Draw the image
        ctx.drawImage(img, x, y, 32, 32);

        // Draw border
        ctx.strokeStyle = 'lime';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 32, 32);

        // Draw label
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        const label = img.src.split('/').pop()?.split('.')[0] || 'sprite';
        ctx.fillText(label, x, y + 45);
      };

      img.onerror = () => {
        // Draw error indicator
        const x = 50 + index * 60;
        const y = 400;

        ctx.fillStyle = 'red';
        ctx.fillRect(x, y, 32, 32);

        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText('X', x + 12, y + 20);
      };
    });
  }

  /**
   * Force an immediate redraw of all layers
   * This can be called to ensure visual updates happen even outside the normal render loop
   */
  public forceRedraw(): void {
    // Execute render callbacks immediately to force updates
    Array.from(this.renderCallbacks).forEach(callback => {
      try {
        callback(16.67); // ~60fps equivalent time step
      } catch (error) {
        console.error('Error in render callback during force redraw:', error);
      }
    });
  }
} 