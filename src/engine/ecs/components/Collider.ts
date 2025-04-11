import { Component } from '../Entity';
import { Vector2 } from './Transform';

export interface CollisionBounds {
  width: number;
  height: number;
  offset: Vector2;
}

export type CollisionLayer = number;

/**
 * Collider component for handling collision detection
 */
export class Collider extends Component {
  private bounds: CollisionBounds;
  private layer: CollisionLayer;
  private isTrigger: boolean;
  private isStatic: boolean;

  constructor(
    bounds: CollisionBounds,
    options: {
      layer?: CollisionLayer;
      isTrigger?: boolean;
      isStatic?: boolean;
    } = {}
  ) {
    super();
    this.bounds = { ...bounds };
    this.layer = options.layer ?? 0;
    this.isTrigger = options.isTrigger ?? false;
    this.isStatic = options.isStatic ?? false;
  }

  getType(): string {
    return 'collider';
  }

  getBounds(): CollisionBounds {
    return { ...this.bounds };
  }

  setBounds(bounds: CollisionBounds): void {
    this.bounds = { ...bounds };
  }

  getLayer(): CollisionLayer {
    return this.layer;
  }

  setLayer(layer: CollisionLayer): void {
    this.layer = layer;
  }

  isTriggerCollider(): boolean {
    return this.isTrigger;
  }

  setTrigger(isTrigger: boolean): void {
    this.isTrigger = isTrigger;
  }

  isStaticCollider(): boolean {
    return this.isStatic;
  }

  setStatic(isStatic: boolean): void {
    this.isStatic = isStatic;
  }

  /**
   * Check if this collider intersects with another collider
   */
  intersects(other: Collider, thisPosition: Vector2, otherPosition: Vector2): boolean {
    const thisLeft = thisPosition.x + this.bounds.offset.x;
    const thisRight = thisLeft + this.bounds.width;
    const thisTop = thisPosition.y + this.bounds.offset.y;
    const thisBottom = thisTop + this.bounds.height;

    const otherLeft = otherPosition.x + other.bounds.offset.x;
    const otherRight = otherLeft + other.bounds.width;
    const otherTop = otherPosition.y + other.bounds.offset.y;
    const otherBottom = otherTop + other.bounds.height;

    return (
      thisLeft < otherRight &&
      thisRight > otherLeft &&
      thisTop < otherBottom &&
      thisBottom > otherTop
    );
  }

  serialize(): object {
    return {
      bounds: { ...this.bounds },
      layer: this.layer,
      isTrigger: this.isTrigger,
      isStatic: this.isStatic
    };
  }

  deserialize(data: {
    bounds?: CollisionBounds;
    layer?: CollisionLayer;
    isTrigger?: boolean;
    isStatic?: boolean;
  }): void {
    if (data.bounds) {
      this.bounds = { ...data.bounds };
    }
    if (typeof data.layer === 'number') {
      this.layer = data.layer;
    }
    if (typeof data.isTrigger === 'boolean') {
      this.isTrigger = data.isTrigger;
    }
    if (typeof data.isStatic === 'boolean') {
      this.isStatic = data.isStatic;
    }
  }
} 