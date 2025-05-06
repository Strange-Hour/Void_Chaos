# ECS Components

This directory contains the core components used in the Entity Component System. Each component represents a specific aspect of game object behavior or state.

## Directory Structure

### Core Components

- `Transform.ts`: Position, rotation, and scale
- `Renderer.ts`: Visual representation and rendering properties
- `Collider.ts`: Collision detection and physics boundaries
- `Health.ts`: Health and damage management
- `Input.ts`: Input handling and controls
- `Weapon.ts`: Weapon systems and combat
- `AI.ts`: Artificial intelligence and behavior

## Component Overview

### Transform Component (`Transform.ts`)

Core spatial component for game objects:

- Position in 2D space
- Rotation angle
- Scale factors
- Local and world space transformations
- Parent-child relationships

### Renderer Component (`Renderer.ts`)

Handles visual representation:

- Sprite references
- Visibility state
- Render layer
- Animation states
- Visual effects properties

### Collider Component (`Collider.ts`)

Physics and collision detection:

- Collision shapes
- Collision layers
- Trigger zones
- Physics materials
- Collision response properties

### Health Component (`Health.ts`)

Entity health and damage system:

- Current and maximum health
- Damage handling
- Recovery/healing
- Invulnerability states
- Death handling

### Input Component (`Input.ts`)

User interaction and control:

- Key bindings
- Input states
- Action mapping
- Input buffering
- Controller support

### Weapon Component (`Weapon.ts`)

Combat and weapon mechanics:

- Weapon types
- Damage properties
- Attack patterns
- Cooldown management
- Ammunition systems

### AI Component (`AI.ts`)

Artificial intelligence behaviors:

- Behavior trees
- Pathfinding
- Decision making
- State machines
- Target tracking

## Implementation Pattern

Each component follows a consistent implementation pattern:

```typescript
export class ComponentName implements Component {
  readonly type = ComponentType.Name;

  // Component-specific properties
  private propertyName: PropertyType;

  constructor(config: ComponentConfig) {
    // Initialize properties
  }

  // Component methods
  public methodName(): ReturnType {
    // Implementation
  }

  // Serialization
  public serialize(): object {
    return {
      // Serialized properties
    };
  }

  public deserialize(data: object): void {
    // Deserialize properties
  }
}
```

## Usage Examples

### Transform Component

```typescript
const entity = new Entity();
const transform = new Transform({
  position: new Vector2(100, 100),
  rotation: Math.PI / 4,
  scale: new Vector2(2, 2),
});
entity.addComponent(transform);
```

### Health Component

```typescript
const player = new Entity();
const health = new Health({
  maxHealth: 100,
  currentHealth: 100,
  regeneration: 1,
});
player.addComponent(health);

// Handle damage
health.takeDamage(20);
```

### Input Component

```typescript
const playerInput = new Input({
  bindings: {
    move_right: ["KeyD", "ArrowRight"],
    jump: ["Space"],
    attack: ["MouseLeft"],
  },
});
entity.addComponent(playerInput);
```

## Testing

Each component has a corresponding test file (`*.test.ts`) that verifies:

- Component initialization
- Property management
- Method functionality
- Serialization/deserialization
- Integration with entities
- Edge cases and error handling

## Design Principles

### 1. Data-Oriented Design

- Components store only data
- Logic lives in systems
- Minimal dependencies between components
- Cache-friendly data layout

### 2. Composition Over Inheritance

- Components are composable
- No component inheritance hierarchies
- Flexible entity composition
- Easy to add/remove behaviors

### 3. Serialization Support

- All components are serializable
- Version-safe serialization
- Clean serialization format
- Migration support for updates

### 4. Performance

- Minimal memory footprint
- Efficient data access
- Optimized for common operations
- Pool-friendly design

### 5. Type Safety

- Strong TypeScript typing
- Compile-time checks
- Runtime type validation
- Clear interfaces

## Component Dependencies

Some components have natural dependencies or relationships:

- Transform → Renderer (for position-based rendering)
- Collider → Transform (for collision detection)
- Weapon → Transform (for weapon positioning)
- AI → Transform (for movement and positioning)

## Best Practices

1. **Component Creation**

   - Keep components focused and single-purpose
   - Use configuration objects for initialization
   - Provide sensible defaults
   - Validate input data

2. **Component Usage**

   - Check for required dependencies
   - Handle missing dependencies gracefully
   - Use type-safe component queries
   - Clean up resources on removal

3. **Testing**
   - Test all public methods
   - Verify state changes
   - Test integration with other components
   - Test edge cases and error conditions

## Enemy System Components

### Enemy Component (`Enemy.ts`)

The Enemy component defines enemy-specific properties and behavior configuration.

#### Enemy Types

```typescript
enum EnemyType {
  Basic = "basic", // Simple chase behavior
  Flanker = "flanker", // Tries to flank the player
  Ranged = "ranged", // Keeps distance and shoots
}
```

#### Configuration

Each enemy type has specific configuration values:

| Type    | Speed | Health | Damage | Detection Range | Attack Range | Score |
| ------- | ----- | ------ | ------ | --------------- | ------------ | ----- |
| Basic   | 150   | 100    | 20     | 400             | 50           | 100   |
| Flanker | 200   | 75     | 15     | 500             | 40           | 150   |
| Ranged  | 100   | 50     | 10     | 600             | 400          | 200   |

#### Features

- Type-specific configurations
- Health and damage management
- Attack cooldown system
- Score values for each enemy type
- Serialization support

#### Usage Example

```typescript
// Create a basic enemy
const enemy = new Enemy(EnemyType.Basic);

// Check health and status
const health = enemy.getCurrentHealth();
const isAlive = enemy.isAlive();

// Handle combat
const currentTime = performance.now();
if (enemy.canAttack(currentTime)) {
  const damage = enemy.attack(currentTime);
}

// Take damage
enemy.takeDamage(20);
```

## Factory System

### EnemyFactory (`factories/EnemyFactory.ts`)

The EnemyFactory creates fully configured enemy entities with all required components.

#### Features

- Creates enemy entities with all necessary components
- Configures type-specific behaviors and stats
- Sets up AI behaviors based on enemy type
- Handles spawn positioning and targeting
- Manages component composition

#### Components Added to Enemies

- Enemy: Core enemy properties and behavior
- Transform: Position and movement
- Health: Health management
- Collider: Collision detection
- AI: Enemy behavior and decision making

#### Usage Example

```typescript
// Create a basic enemy at position
const enemy = EnemyFactory.createEnemy({
  position: { x: 100, y: 200 },
  type: EnemyType.Basic,
});

// Create a ranged enemy with target
const rangedEnemy = EnemyFactory.createEnemy({
  position: { x: 300, y: 400 },
  type: EnemyType.Ranged,
  aiTarget: {
    x: 500,
    y: 500,
    type: "player",
  },
});
```

## Integration with Other Components

### AI Integration

- Uses the AI component for behavior management
- Different behaviors per enemy type:
  - Basic: Chase behavior
  - Flanker: Flanking behavior
  - Ranged: Keep distance and attack behaviors
- All enemies have an idle behavior state

### Health Integration

- Uses the Health component for damage and healing
- Type-specific max health values
- Supports regeneration (if configured)

### Collider Integration

- Uses the Collider component for hit detection
- Centered collision boxes (32x32 default)
- Non-trigger colliders for physical interaction

### Transform Integration

- Uses Transform component for positioning
- Supports movement and rotation
- Maintains spawn position configuration

## Testing

All components and factories have comprehensive test coverage:

- Enemy component tests (`Enemy.test.ts`)

  - Initialization and configuration
  - Health management
  - Attack system
  - Scoring system
  - Serialization

- EnemyFactory tests (`EnemyFactory.test.ts`)
  - Component composition
  - Type-specific configurations
  - AI behavior setup
  - Target configuration
  - Position handling
