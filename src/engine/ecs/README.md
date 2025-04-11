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
