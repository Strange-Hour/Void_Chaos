/**
 * Camera.ts
 * Handles viewport management and coordinate transformations for the game world
 */

export interface CameraConfig {
  x?: number;
  y?: number;
  width: number;
  height: number;
  minX?: number;
  minY?: number;
  maxX?: number;
  maxY?: number;
  zoom?: number;
}

export class Camera {
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private minX: number;
  private minY: number;
  private maxX: number;
  private maxY: number;
  private zoom: number;

  constructor(config: CameraConfig) {
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.width = config.width;
    this.height = config.height;
    this.minX = config.minX ?? -Infinity;
    this.minY = config.minY ?? -Infinity;
    this.maxX = config.maxX ?? Infinity;
    this.maxY = config.maxY ?? Infinity;
    this.zoom = config.zoom || 1;
  }

  /**
   * Moves the camera by the specified delta
   */
  public move(dx: number, dy: number): void {
    this.setPosition(this.x + dx, this.y + dy);
  }

  /**
   * Sets the camera position, respecting bounds
   */
  public setPosition(x: number, y: number): void {
    this.x = Math.max(this.minX, Math.min(this.maxX - this.width, x));
    this.y = Math.max(this.minY, Math.min(this.maxY - this.height, y));
  }

  /**
   * Sets the camera zoom level
   */
  public setZoom(zoom: number): void {
    this.zoom = Math.max(0.1, zoom); // Prevent negative or zero zoom
  }

  /**
   * Converts world coordinates to screen coordinates
   */
  public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: (worldX - this.x) * this.zoom,
      y: (worldY - this.y) * this.zoom
    };
  }

  /**
   * Converts screen coordinates to world coordinates
   */
  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX / this.zoom + this.x,
      y: screenY / this.zoom + this.y
    };
  }

  /**
   * Checks if a point in world coordinates is visible in the viewport
   */
  public isPointVisible(worldX: number, worldY: number): boolean {
    return (
      worldX >= this.x &&
      worldX <= this.x + this.width / this.zoom &&
      worldY >= this.y &&
      worldY <= this.y + this.height / this.zoom
    );
  }

  /**
   * Checks if a rectangle in world coordinates is visible in the viewport
   */
  public isRectVisible(x: number, y: number, width: number, height: number): boolean {
    return (
      x + width >= this.x &&
      x <= this.x + this.width / this.zoom &&
      y + height >= this.y &&
      y <= this.y + this.height / this.zoom
    );
  }

  /**
   * Gets the current camera viewport dimensions
   */
  public getViewport(): { x: number; y: number; width: number; height: number; zoom: number } {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      zoom: this.zoom
    };
  }

  /**
   * Sets the camera bounds
   */
  public setBounds(minX: number, minY: number, maxX: number, maxY: number): void {
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
    // Ensure camera stays within new bounds
    this.setPosition(this.x, this.y);
  }
} 