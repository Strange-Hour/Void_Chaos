/**
 * Canvas.ts
 * Handles canvas initialization, scaling, and basic rendering setup
 */

import { Layer, LayerConfig } from './Layer';

interface CanvasConfig {
  width: number;
  height: number;
  containerId?: string;
  pixelRatio?: number;
  backgroundColor?: string;
}

export class Canvas {
  private container: HTMLElement | null;
  private pixelRatio: number;
  private width: number;
  private height: number;
  private backgroundColor: string;
  private layers: Map<string, Layer>;
  private containerElement: HTMLDivElement;

  constructor(config: CanvasConfig) {
    this.width = config.width;
    this.height = config.height;
    this.pixelRatio = config.pixelRatio || window.devicePixelRatio || 1;
    this.backgroundColor = config.backgroundColor || '#000000';
    this.layers = new Map();

    // Create container element
    this.containerElement = document.createElement('div');
    this.containerElement.style.position = 'relative';
    this.containerElement.style.width = `${this.width}px`;
    this.containerElement.style.height = `${this.height}px`;
    this.containerElement.style.backgroundColor = this.backgroundColor;

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

    // Create default background layer
    this.createLayer('background', { zIndex: 0 });

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
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
   * Cleanup method to remove event listeners and elements
   */
  public destroy(): void {
    window.removeEventListener('resize', this.handleResize);
    this.layers.forEach((_, name) => this.removeLayer(name));
    this.containerElement.remove();
  }
} 