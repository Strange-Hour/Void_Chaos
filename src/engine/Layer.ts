/**
 * Layer.ts
 * Represents a single canvas layer for rendering different types of content
 */

export interface LayerConfig {
  width: number;
  height: number;
  zIndex: number;
  pixelRatio?: number;
  isVisible?: boolean;
}

export class Layer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private pixelRatio: number;
  private zIndex: number;
  private isVisible: boolean;

  constructor(config: LayerConfig) {
    this.width = config.width;
    this.height = config.height;
    this.zIndex = config.zIndex;
    this.pixelRatio = config.pixelRatio || window.devicePixelRatio || 1;
    this.isVisible = config.isVisible ?? true;

    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;

    if (!this.ctx) {
      throw new Error('Failed to get 2D rendering context for layer');
    }

    // Setup canvas
    this.setupCanvas();
    this.updateStyle();
  }

  /**
   * Sets up the canvas with proper scaling and size
   */
  private setupCanvas(): void {
    // Set canvas size accounting for pixel ratio
    this.canvas.width = this.width * this.pixelRatio;
    this.canvas.height = this.height * this.pixelRatio;

    // Scale canvas CSS dimensions for proper display
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    // Scale the context to account for pixel ratio
    this.ctx.scale(this.pixelRatio, this.pixelRatio);
  }

  /**
   * Updates the canvas element style based on layer properties
   */
  private updateStyle(): void {
    this.canvas.style.position = 'absolute';
    this.canvas.style.zIndex = this.zIndex.toString();
    this.canvas.style.display = this.isVisible ? 'block' : 'none';
  }

  /**
   * Clears the entire layer
   */
  public clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  /**
   * Gets the layer's rendering context
   */
  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  /**
   * Gets the layer's canvas element
   */
  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Sets the visibility of the layer
   */
  public setVisible(visible: boolean): void {
    this.isVisible = visible;
    this.canvas.style.display = visible ? 'block' : 'none';
  }

  /**
   * Gets the current visibility state
   */
  public isLayerVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Gets the layer's z-index
   */
  public getZIndex(): number {
    return this.zIndex;
  }

  /**
   * Sets the layer's z-index
   */
  public setZIndex(zIndex: number): void {
    this.zIndex = zIndex;
    this.canvas.style.zIndex = zIndex.toString();
  }

  /**
   * Gets the layer dimensions
   */
  public getDimensions(): { width: number; height: number } {
    return {
      width: this.width,
      height: this.height
    };
  }

  /**
   * Resizes the layer
   */
  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.setupCanvas();
  }
} 