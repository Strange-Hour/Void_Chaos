# ECS Systems

This directory contains the Entity Component System (ECS) systems that handle core game logic, simulation, and debugging features.

## Directory Structure

- `AIBehaviorSystem.ts` - Manages AI entity behavior and delegates movement logic to pluggable patterns
- `CharacterControllerSystem.ts` - Handles character movement, physics, and smooth rotation based on controller state
- `CollisionSystem.ts` - Detects and resolves collisions, manages collision callbacks, and enforces world boundaries
- `DebugSystem.ts` - Provides real-time debug overlays, FPS counter, entity state, and visual debugging tools
- `InputSystem.ts` - Updates input state, applies input actions to player entities, and smooths input
- `RenderSystem.ts` - Renders all visible entities to the canvas, sorted by z-index
- `WaveSpawnSystem.ts` - Manages wave-based enemy spawning, difficulty scaling, and spawn patterns
- `WorldSystem.ts` - Integrates the World update loop with the ECS and game loop

## Components/Features

### InputSystem

Bridges the ECS architecture and the input handling system. Ensures input state is updated each frame and applies input actions to the player entity.

- Updates `InputManager` state each frame
- Applies movement and aim input to the player
- Smooths input for responsive control
- Integrates with multiple input providers (keyboard, mouse, etc.)

#### Usage Example

```typescript
const inputManager = new InputManager();
const keyboardProvider = new KeyboardInputProvider();
inputManager.registerProvider(keyboardProvider);
const inputSystem = new InputSystem(inputManager);
game.addSystem(inputSystem);
```

### AIBehaviorSystem

Manages AI entity behavior and movement patterns. **All movement direction logic is delegated to the movement pattern system.**

- For each AI entity:
  - Computes pathfinding (A\*) to the target (usually the player)
  - Retrieves the current movement pattern from the AI component's state machine
  - Looks up the pattern implementation from the pattern registry
  - Builds the context (grid, path, nextWaypoint, etc.)
  - Calls `getMoveDirection` on the pattern, passing all context
  - Uses the returned direction for movement and aiming
- All movement logic (chase, flank, retreat, idle, etc.) is encapsulated in pluggable pattern classes
- To add a new movement pattern, implement the `IMovementPattern` interface and register it in the pattern registry

> **Note:** The AIBehaviorSystem no longer contains any direct movement logic for chase, flank, or other behaviors. All such logic is handled by the movement pattern system.

### CharacterControllerSystem

Handles character movement and physics based on the `CharacterController` state. Reads move and aim direction, applies acceleration, deceleration, and smooth rotation.

- Applies physics to the `Transform` component
- Smooths rotation towards aim direction
- Supports configurable acceleration, deceleration, and max speed
- Used for both player and AI-controlled entities

### CollisionSystem

Detects and resolves collisions between entities, manages collision callbacks, and enforces world boundaries.

- Supports layer-based collision rules
- Registers custom collision callbacks (e.g., player-enemy interactions)
- Resolves solid collisions and applies push-back
- Enforces world boundaries and constrains entity positions
- Debug mode can be enabled for collision visualization

### WaveSpawnSystem

Manages wave-based enemy spawning, difficulty scaling, and spawn patterns.

- Configures waves with enemy types, counts, delays, and difficulty multipliers
- Supports random, sequential, and synchronized spawn patterns
- Scales difficulty based on wave number and player count
- Exposes methods to start/reset waves and query wave state
- Debug mode can be enabled for spawn diagnostics

### RenderSystem

Renders all visible entities to the canvas, sorted by z-index.

- Draws sprites centered on entity positions
- Supports opacity and rotation
- Forces immediate update when entities are added

### WorldSystem

Integrates the World update loop with the ECS and game loop.

- Calls world update, fixedUpdate, and interpolatedUpdate as needed
- Ensures all systems are updated in sync with the game

### DebugSystem

Provides real-time debug overlays for ECS entities and game state. **Debug mode** can be toggled (e.g., with F1) to enable overlays.

#### Debug Overlays Include:

- Entity outlines and type labels (player, enemy, etc.)
- Health bars and current/max health values
- AI state, movement pattern, and target coordinates
- Velocity vectors and values
- Pathfinding lines for AI entities
- Collider bounds and debug grid
- **FPS counter** in the top right corner (color-coded: green/yellow/red)
- Enemy count breakdown

#### Debugging Mode: What to Expect

When debug mode is enabled:

- All overlays are drawn on a dedicated debug canvas layer
- FPS counter appears in the top right, color-coded:
  - **Green**: 60+ FPS (target)
  - **Yellow**: 50-60 FPS (warning)
  - **Red**: <50 FPS (critical)
- Entity outlines and labels help identify players, enemies, and their states
- Health bars and values are shown below entities
- AI entities display their current movement pattern and target
- Velocity vectors are drawn for moving entities
- Pathfinding lines show AI navigation
- Collider bounds and debug grid are visible for collision diagnostics
- All overlays use a consistent badge style for clarity
- Debug mode can be toggled at runtime (e.g., via F1 or programmatically)

#### Usage Example

```typescript
const debugSystem = new DebugSystem(canvas, inputManager);
debugSystem.toggleDebug(); // or trigger via input (e.g., F1)
```
