/**
 * Represents a 2D vector with x and y components
 */
export interface Vector2 {
  x: number;
  y: number;
}

/**
 * Vector2 utility functions
 */
export const Vector2Utils = {
  /**
   * Add two vectors
   */
  add(a: Vector2, b: Vector2): Vector2 {
    return {
      x: a.x + b.x,
      y: a.y + b.y
    };
  },

  /**
   * Subtract vector b from vector a
   */
  subtract(a: Vector2, b: Vector2): Vector2 {
    return {
      x: a.x - b.x,
      y: a.y - b.y
    };
  },

  /**
   * Scale a vector by a scalar value
   */
  scale(v: Vector2, scalar: number): Vector2 {
    return {
      x: v.x * scalar,
      y: v.y * scalar
    };
  },

  /**
   * Calculate the dot product of two vectors
   */
  dot(a: Vector2, b: Vector2): number {
    return a.x * b.x + a.y * b.y;
  },

  /**
   * Calculate the magnitude (length) of a vector
   */
  magnitude(v: Vector2): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  },

  /**
   * Normalize a vector (make its length 1)
   */
  normalize(v: Vector2): Vector2 {
    const mag = this.magnitude(v);
    if (mag === 0) {
      return { x: 0, y: 0 };
    }
    return this.scale(v, 1 / mag);
  },

  /**
   * Calculate the distance between two points
   */
  distance(a: Vector2, b: Vector2): number {
    return this.magnitude(this.subtract(b, a));
  },

  /**
   * Rotate a vector by an angle (in radians)
   */
  rotate(v: Vector2, angle: number): Vector2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: v.x * cos - v.y * sin,
      y: v.x * sin + v.y * cos
    };
  }
}; 