import { Component } from '../Entity';
import { Vector2 } from '../../math/Vector2';

/**
 * Component that represents the position, rotation, and scale of an entity
 */
export class Transform extends Component {
  private position: Vector2;
  private rotation: number;
  private scale: Vector2;

  constructor(position: Vector2 = { x: 0, y: 0 }, rotation: number = 0, scale: Vector2 = { x: 1, y: 1 }) {
    super();
    this.position = { ...position };
    this.rotation = rotation;
    this.scale = { ...scale };
  }

  getType(): string {
    return 'transform';
  }

  getPosition(): Vector2 {
    return { ...this.position };
  }

  setPosition(position: Vector2): void {
    this.position = { ...position };
  }

  getRotation(): number {
    return this.rotation;
  }

  setRotation(rotation: number): void {
    this.rotation = rotation;
  }

  getScale(): Vector2 {
    return { ...this.scale };
  }

  setScale(scale: Vector2): void {
    this.scale = { ...scale };
  }

  translate(delta: Vector2): void {
    this.position.x += delta.x;
    this.position.y += delta.y;
  }

  rotate(delta: number): void {
    this.rotation += delta;
  }

  serialize(): object {
    return {
      position: { ...this.position },
      rotation: this.rotation,
      scale: { ...this.scale }
    };
  }

  deserialize(data: { position: Vector2; rotation: number; scale: Vector2 }): void {
    this.position = { ...data.position };
    this.rotation = data.rotation;
    this.scale = { ...data.scale };
  }
} 