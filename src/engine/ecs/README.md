# Entity Component System (ECS)

This directory implements a robust Entity Component System, a design pattern commonly used in game development for managing game objects and their behaviors.

## Directory Structure

### Core Files

- `Entity.ts`: Entity class and management
- `System.ts`: System base class and processing
- `Serialization.ts`: State serialization and deserialization

### Subdirectories

- `/components`: Component definitions and implementations

## ECS Architecture

### Entity System (`Entity.ts`)

- Unique entity identification
- Component attachment and detachment
- Entity lifecycle management
- Query interface for components
- Entity pooling for performance

### System Management (`System.ts`)

- System registration and execution
- Update cycle management
- Entity filtering and processing
- System dependencies
- Performance optimization

### Serialization (`Serialization.ts`)

- Game state serialization
- Save/load functionality
- Component data serialization
- State versioning
- Migration handling

### Components

Components are data containers that define entity properties:

- Position components
- Rendering components
- Physics components
- Input components
- Custom game-specific components

## Implementation Details

### Entity Implementation

```typescript
class Entity {
  id: number;
  components: Map<ComponentType, Component>;

  addComponent(component: Component): void;
  removeComponent(type: ComponentType): void;
  hasComponent(type: ComponentType): boolean;
}
```

### System Implementation

```typescript
abstract class System {
  entities: Set<Entity>;

  abstract update(deltaTime: number): void;
  filter(entity: Entity): boolean;
  addEntity(entity: Entity): void;
}
```

### Component Pattern

```typescript
interface Component {
  type: ComponentType;
  entity?: Entity;
  serialize(): object;
  deserialize(data: object): void;
}
```

## Design Philosophy

The ECS implementation follows these principles:

1. **Performance**

   - Efficient component storage
   - Optimized entity queries
   - Minimal memory allocation
   - Cache-friendly data layout

2. **Flexibility**

   - Easy to add new components
   - System composition
   - Dynamic entity modification
   - Runtime component management

3. **Maintainability**

   - Clear separation of concerns
   - Type-safe implementation
   - Comprehensive testing
   - Serialization support

4. **Scalability**
   - Handles large numbers of entities
   - Efficient batch processing
   - Memory pooling
   - Parallel processing ready

## Usage Example

```typescript
// Creating and using entities
const entity = new Entity();
entity.addComponent(new PositionComponent(x, y));
entity.addComponent(new SpriteComponent(texture));

// System implementation
class MovementSystem extends System {
  update(deltaTime: number) {
    for (const entity of this.entities) {
      const pos = entity.getComponent(ComponentType.Position);
      const vel = entity.getComponent(ComponentType.Velocity);
      pos.x += vel.x * deltaTime;
      pos.y += vel.y * deltaTime;
    }
  }
}
```

## Testing

Each core component has corresponding test files that verify:

- Entity management
- System processing
- Component operations
- Serialization
- Edge cases and error handling

## Components

### Transform

Handles entity position, rotation, and scale in 2D space.

### Collider

Manages collision detection and physics interactions.

### CharacterController

Provides physics-based character movement with input handling.

#### Features

- Smooth acceleration and deceleration
- Configurable movement parameters
- Friction and momentum
- Maximum speed limits
- Independent movement and aim directions
- Rotation interpolation

#### Usage Example

```typescript
import { Entity } from "../Entity";
import { Transform } from "./components/Transform";
import { CharacterController } from "./components/CharacterController";
import { CharacterControllerSystem } from "./systems/CharacterControllerSystem";

// Create player entity
const player = new Entity();
player.addComponent(new Transform());
player.addComponent(
  new CharacterController({
    maxSpeed: 300,
    acceleration: 1000,
    deceleration: 800,
    rotationSpeed: 5,
    mass: 1,
    friction: 0.1,
  })
);

// Add to character controller system
const characterSystem = new CharacterControllerSystem(inputManager);
characterSystem.addEntity(player);
```

## Systems

### CharacterControllerSystem

Manages character movement and physics integration.

#### Features

- Input processing for movement and aiming
- Physics-based movement updates
- Smooth rotation interpolation
- Multi-entity support
- Fixed timestep updates

#### Implementation Details

- Uses fixed timestep for consistent physics
- Processes input from keyboard, mouse, and touch
- Updates entity transforms based on physics state
- Handles entity cleanup and disposal

## Updates and Changes

### [2024-03-19] - Task #3.4

- Added CharacterController component
- Added CharacterControllerSystem
- Implemented physics-based movement
- Added comprehensive test coverage
- Features added:
  - Smooth acceleration/deceleration
  - Configurable movement parameters
  - Input-driven movement and aiming
  - Physics integration
  - Transform updates

## Best Practices

1. Component Usage

   - Keep components focused and single-purpose
   - Use appropriate data types for properties
   - Implement proper cleanup in dispose methods
   - Follow serialization patterns for save/load

2. System Implementation

   - Use fixed timestep for physics
   - Handle component dependencies properly
   - Clean up resources on disposal
   - Use appropriate update methods

3. Entity Management
   - Add required components before system registration
   - Remove entities from systems before disposal
   - Use appropriate component queries
   - Handle missing components gracefully

## Dependencies

- Core ECS types from `Entity.ts` and `System.ts`
- Input system for movement control
- Math utilities for vector operations
- Transform component for position/rotation
- Game loop with fixed timestep support

## Performance Considerations

1. Physics Updates

   - Use fixed timestep for consistent simulation
   - Optimize vector calculations
   - Minimize object creation in update loops
   - Use efficient data structures

2. Input Processing

   - Process input events efficiently
   - Use normalized vectors for consistent behavior
   - Cache frequently accessed values
   - Handle multiple input methods smoothly

3. Memory Management
   - Properly dispose of entities and components
   - Clear references in cleanup methods
   - Use object pooling when appropriate
   - Minimize garbage collection impact
