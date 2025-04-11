# Math Utilities

This directory contains mathematical utilities essential for game development, focusing on 2D mathematics and physics calculations.

## Directory Structure

### Core Files

- `Vector2.ts`: 2D vector operations and utilities

## Mathematical Components

### Vector2 (`Vector2.ts`)

A comprehensive 2D vector implementation providing:

#### Basic Operations

- Addition and subtraction
- Scalar multiplication and division
- Dot product
- Cross product
- Normalization
- Magnitude calculation

#### Vector Functions

- Distance calculation
- Angle between vectors
- Linear interpolation (lerp)
- Vector rotation
- Direction calculation
- Reflection and projection

#### Utility Methods

- Vector cloning
- Vector comparison
- Conversion to/from arrays
- String representation
- Zero and unit vector constants

## Usage Examples

```typescript
// Basic vector operations
const pos = new Vector2(10, 20);
const vel = new Vector2(5, -3);
const newPos = pos.add(vel.multiply(deltaTime));

// Distance calculation
const distance = pos.distanceTo(target);

// Angle and rotation
const angle = pos.angleTo(target);
const rotated = pos.rotate(Math.PI / 2);

// Normalization and scaling
const direction = pos.subtract(target).normalize();
const scaled = direction.multiply(speed);
```

## Common Game Development Use Cases

### Movement and Position

```typescript
// Update position based on velocity
position.add(velocity.multiply(deltaTime));

// Move towards target
const direction = target.subtract(position).normalize();
position.add(direction.multiply(speed * deltaTime));
```

### Physics and Collision

```typescript
// Reflect velocity off surface
const normal = surfaceNormal.normalize();
velocity = velocity.reflect(normal);

// Check distance for collision
if (position.distanceTo(other) < collisionRadius) {
  handleCollision();
}
```

### Camera and Viewport

```typescript
// Convert world to screen coordinates
const screenPos = worldPos.subtract(cameraPos).multiply(zoom);

// Calculate view bounds
const viewBounds = {
  min: cameraPos.subtract(viewportSize.multiply(0.5)),
  max: cameraPos.add(viewportSize.multiply(0.5)),
};
```

## Design Philosophy

The math utilities follow these principles:

1. **Performance**

   - Minimal object creation
   - Optimized calculations
   - In-place operations where possible
   - Cache-friendly data structures

2. **Precision**

   - Accurate floating-point operations
   - Handling edge cases
   - Numerical stability
   - Consistent results

3. **Usability**

   - Intuitive API
   - Method chaining
   - Clear documentation
   - Common game dev patterns

4. **Extensibility**
   - Easy to add new operations
   - Composable functions
   - Reusable components
   - Framework agnostic

## Future Additions

Planned mathematical utilities to be added:

- Matrix operations
- Quaternions
- Collision detection
- Physics calculations
- Random number generation
- Interpolation functions
- Bezier curves
- Noise functions
