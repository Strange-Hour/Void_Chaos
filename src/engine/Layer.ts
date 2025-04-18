/**
 * Layer.ts
 * Represents a single canvas layer for rendering different types of content
 */

import { LayerName } from '@/config';

export interface LayerConfig {
  name: LayerName;
  zIndex: number;
  isVisible?: boolean;
}

export class Layer {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private name: LayerName;
  private zIndex: number;
  private isVisible: boolean;

  constructor(config: LayerConfig) {
    this.name = config.name;
    this.zIndex = config.zIndex;
    this.isVisible = config.isVisible ?? true;

    this.canvas = document.createElement('canvas');

    // Set up canvas styling
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.display = this.isVisible ? 'block' : 'none';
    this.canvas.style.zIndex = this.zIndex.toString();

    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }
    this.context = context;

    // Enable image smoothing for better visual quality
    this.context.imageSmoothingEnabled = true;
  }

  public setDimensions(width: number, height: number, scale: number = 1): void {
    this.canvas.width = width * scale;
    this.canvas.height = height * scale;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  public getName(): LayerName {
    return this.name;
  }

  public getZIndex(): number {
    return this.zIndex;
  }

  public setZIndex(zIndex: number): void {
    this.zIndex = zIndex;
    this.canvas.style.zIndex = zIndex.toString();
  }

  public isLayerVisible(): boolean {
    return this.isVisible;
  }

  public setVisible(visible: boolean): void {
    this.isVisible = visible;
    this.canvas.style.display = visible ? 'block' : 'none';
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getContext(): CanvasRenderingContext2D {
    return this.context;
  }

  public clear(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
} 