import { Component } from '../Entity';
import { Sprite } from '../../Sprite';

export interface RenderOptions {
  visible: boolean;
  opacity: number;
  zIndex: number;
}

/**
 * Renderer component for handling sprite rendering
 */
export class Renderer extends Component {
  private sprite: Sprite;
  private options: RenderOptions;

  constructor(sprite: Sprite, options: Partial<RenderOptions> = {}) {
    super();
    this.sprite = sprite;
    this.options = {
      visible: true,
      opacity: 1,
      zIndex: 0,
      ...options
    };
  }

  getType(): string {
    return 'renderer';
  }

  getSprite(): Sprite {
    return this.sprite;
  }

  setSprite(sprite: Sprite): void {
    this.sprite = sprite;
  }

  isVisible(): boolean {
    return this.options.visible;
  }

  setVisible(visible: boolean): void {
    this.options.visible = visible;
  }

  getOpacity(): number {
    return this.options.opacity;
  }

  setOpacity(opacity: number): void {
    this.options.opacity = Math.max(0, Math.min(1, opacity));
  }

  getZIndex(): number {
    return this.options.zIndex;
  }

  setZIndex(zIndex: number): void {
    this.options.zIndex = zIndex;
  }

  serialize(): object {
    return {
      spriteUrl: this.sprite.getImage().src,
      options: { ...this.options }
    };
  }

  deserialize(data: { spriteUrl?: string; options?: Partial<RenderOptions> }): void {
    // Note: Sprite deserialization should be handled by a sprite manager
    // Here we only update the options
    if (data.options) {
      this.options = {
        ...this.options,
        ...data.options
      };
    }
  }
} 