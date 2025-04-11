# ECS Factories

This directory contains factory classes that create and configure entities with specific component combinations. Factories ensure consistent entity creation and encapsulate complex setup logic.

## Enemy Factory System

### EnemyFactory (`EnemyFactory.ts`)

The EnemyFactory creates fully configured enemy entities with appropriate components and behaviors.

#### Interface

```typescript
interface EnemySpawnOptions {
  position: { x: number; y: number };
  type?: EnemyType;
  aiTarget?: { x: number; y: number; type: string };
}
```

#### Factory Methods

```typescript
class EnemyFactory {
  static createEnemy(options: EnemySpawnOptions): Entity;
  private static setupAIBehaviors(ai: AI, type: EnemyType): void;
}
```

#### Components Created

| Component | Purpose                      | Configuration                      |
| --------- | ---------------------------- | ---------------------------------- |
| Enemy     | Core enemy behavior          | Type-specific stats and abilities  |
| Transform | Position and movement        | Initial spawn position             |
| Health    | Health and damage management | Type-based max health              |
| Collider  | Collision detection          | 32x32 centered collision box       |
| AI        | Behavior and decision making | Type-specific behaviors and states |

#### Enemy Types and Behaviors

1. **Basic Enemy**

   - Simple chase behavior
   - Direct pursuit of target
   - Close-range combat

   ```typescript
   const basicEnemy = EnemyFactory.createEnemy({
     position: { x: 100, y: 100 },
     type: EnemyType.Basic,
   });
   ```

2. **Flanker Enemy**

   - Advanced movement patterns
   - Attempts to flank targets
   - Medium-range engagement

   ```typescript
   const flanker = EnemyFactory.createEnemy({
     position: { x: 200, y: 200 },
     type: EnemyType.Flanker,
     aiTarget: { x: 300, y: 300, type: "player" },
   });
   ```

3. **Ranged Enemy**
   - Maintains distance
   - Long-range attacks
   - Defensive positioning
   ```typescript
   const rangedEnemy = EnemyFactory.createEnemy({
     position: { x: 400, y: 400 },
     type: EnemyType.Ranged,
   });
   ```

#### AI Behavior States

Each enemy type has specific AI behaviors:

```typescript
// Basic Enemy Behaviors
{
  chase: () => { /* Direct pursuit */ },
  idle: () => { /* Default state */ }
}

// Flanker Behaviors
{
  flank: () => { /* Flanking movement */ },
  idle: () => { /* Default state */ }
}

// Ranged Enemy Behaviors
{
  keepDistance: () => { /* Maintain range */ },
  attack: () => { /* Ranged attacks */ },
  idle: () => { /* Default state */ }
}
```

#### Component Configuration Details

1. **Transform Component**

   - Initial position from spawn options
   - Default rotation of 0
   - Default scale of 1,1

2. **Health Component**

   - Basic: 100 HP
   - Flanker: 75 HP
   - Ranged: 50 HP
   - All support damage and healing

3. **Collider Component**

   - 32x32 pixel collision box
   - Centered offset (-16, -16)
   - Non-trigger type
   - Physical collision enabled

4. **AI Component**
   - Type-specific behavior setup
   - Target tracking support
   - State machine management
   - Behavior transitions

#### Usage Examples

1. **Basic Spawn**

```typescript
const enemy = EnemyFactory.createEnemy({
  position: { x: 100, y: 100 },
}); // Creates basic enemy by default
```

2. **Targeted Spawn**

```typescript
const enemy = EnemyFactory.createEnemy({
  position: { x: 200, y: 200 },
  type: EnemyType.Flanker,
  aiTarget: {
    x: 300,
    y: 300,
    type: "player",
  },
});
```

3. **Multiple Enemy Types**

```typescript
const enemies = [
  EnemyFactory.createEnemy({
    position: { x: 100, y: 100 },
    type: EnemyType.Basic,
  }),
  EnemyFactory.createEnemy({
    position: { x: 200, y: 200 },
    type: EnemyType.Flanker,
  }),
  EnemyFactory.createEnemy({
    position: { x: 300, y: 300 },
    type: EnemyType.Ranged,
  }),
];
```

### Testing

The EnemyFactory includes comprehensive tests in `EnemyFactory.test.ts`:

- Component composition verification
- Type-specific configuration testing
- AI behavior setup validation
- Target configuration testing
- Position handling verification
- Error case handling

### Updates and Changes

#### [2024-03-XX] - Task #4.1

- Implemented EnemyFactory with support for three enemy types
- Added component composition and configuration
- Implemented type-specific AI behaviors
- Added spawn position and targeting support
- Created comprehensive test coverage

### Best Practices

1. **Entity Creation**

   - Use factory methods instead of direct entity creation
   - Validate all input parameters
   - Ensure consistent component composition
   - Handle error cases gracefully

2. **Component Configuration**

   - Use type-specific configurations
   - Set reasonable default values
   - Validate component dependencies
   - Maintain consistent naming

3. **Testing**
   - Test all enemy type configurations
   - Verify component relationships
   - Test error handling
   - Validate behavior setup
