/**
 * Canvas.ts
 * Handles canvas initialization, scaling, and basic rendering setup
 */

import { Layer, LayerConfig } from './Layer';
import { Camera, CameraConfig } from './Camera';
import { SpriteManager } from './SpriteManager';

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
  private container: HTMLElement | null;
  private pixelRatio: number;
  private width: number;
  private height: number;
  private backgroundColor: string;
  private layers: Map<string, Layer>;
  private containerElement: HTMLDivElement;
  private camera: Camera;
  private isRunning: boolean;
  private lastFrameTime: number;
  private animationFrameId: number;
  private renderCallbacks: Set<RenderCallback>;
  private targetFPS: number;
  private minFrameTime: number;
  private renderStats: RenderStats;
  private spriteManager: SpriteManager;

  constructor(config: CanvasConfig) {
    this.width = config.width;
    this.height = config.height;
    this.pixelRatio = config.pixelRatio || window.devicePixelRatio || 1;
    this.backgroundColor = config.backgroundColor || '#000000';
    this.layers = new Map();
    this.isRunning = false;
    this.lastFrameTime = 0;
    this.animationFrameId = 0;
    this.renderCallbacks = new Set();
    this.targetFPS = config.targetFPS || 60;
    this.minFrameTime = 1000 / this.targetFPS;
    this.renderStats = {
      fps: 0,
      frameTime: 0,
      frameCount: 0,
      lastFpsUpdate: 0
    };

    // Create container element
    this.containerElement = document.createElement('div');
    this.containerElement.style.position = 'relative';
    this.containerElement.style.width = `${this.width}px`;
    this.containerElement.style.height = `${this.height}px`;
    this.containerElement.style.backgroundColor = this.backgroundColor;
    this.containerElement.style.overflow = 'hidden'; // Ensure content doesn't overflow

    // Debug style to make sure container is visible
    this.containerElement.style.border = '2px solid red';

    // Setup container
    if (config.containerId) {
      this.container = document.getElementById(config.containerId);
      if (!this.container) {
        throw new Error(`Container with id "${config.containerId}" not found`);
      }
      this.container.appendChild(this.containerElement);
    } else {
      document.body.appendChild(this.containerElement);
      this.container = document.body;
    }

    // Initialize camera
    this.camera = new Camera({
      width: this.width,
      height: this.height,
      ...config.camera
    });

    // Create default background layer
    this.createLayer('background', { zIndex: 0 });

    // Initialize sprite manager
    this.spriteManager = new SpriteManager();

    this.handleResize = this.handleResize.bind(this);
    this.renderLoop = this.renderLoop.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Starts the render loop
   */
  public start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastFrameTime = performance.now();
      this.renderStats.lastFpsUpdate = this.lastFrameTime;
      this.renderLoop();
    }
  }

  /**
   * Stops the render loop
   */
  public stop(): void {
    if (this.isRunning) {
      this.isRunning = false;
      cancelAnimationFrame(this.animationFrameId);
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
    if (!this.isRunning) {
      return;
    }

    // Calculate frame timing
    const deltaTime = currentTime - this.lastFrameTime;

    // Skip frame if we're running too fast
    if (deltaTime < this.minFrameTime) {
      this.animationFrameId = requestAnimationFrame(this.renderLoop);
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
        callback(deltaTime);
      } catch (error) {
        console.error('Error in render callback:', error);
      }
    });

    // Request next frame
    this.animationFrameId = requestAnimationFrame(this.renderLoop);
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
  public createLayer(name: string, config: Partial<LayerConfig> = {}): Layer {
    if (this.layers.has(name)) {
      throw new Error(`Layer "${name}" already exists`);
    }

    const layerConfig: LayerConfig = {
      width: this.width,
      height: this.height,
      zIndex: config.zIndex || this.layers.size,
      pixelRatio: this.pixelRatio,
      isVisible: config.isVisible
    };

    const layer = new Layer(layerConfig);
    this.containerElement.appendChild(layer.getCanvas());
    this.layers.set(name, layer);

    return layer;
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
  private handleResize(): void {
    // Update container size
    this.containerElement.style.width = `${this.width}px`;
    this.containerElement.style.height = `${this.height}px`;

    // Update camera dimensions
    this.camera = new Camera({
      ...this.camera.getViewport(),
      width: this.width,
      height: this.height
    });

    // Update all layers
    this.layers.forEach(layer => {
      layer.resize(this.width, this.height);
    });
  }

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
      '/sprites/enemy-ranged.svg'
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

    console.log('Force redraw triggered for all layers');
  }
} 