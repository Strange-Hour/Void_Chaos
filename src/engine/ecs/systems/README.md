# ECS Systems

This directory contains the Entity Component System (ECS) systems that handle game logic and behavior.

## Directory Structure

- `AIBehaviorSystem.ts` - Handles AI entity behavior and movement patterns
- `InputSystem.ts` - Manages input state updates and integration with ECS
- Other system files...

## Components/Features

### InputSystem

The InputSystem bridges the gap between the ECS architecture and the input handling system. It ensures input state is updated each frame.

#### Implementation Details

- Updates InputManager state each frame
- No entity processing (system-level update only)
- Integrates with multiple input providers (keyboard, mouse, etc.)
- Maintains input state consistency across the game loop

#### Usage Example

```typescript
// Setup input system
const inputManager = new InputManager();
const keyboardProvider = new KeyboardInputProvider();
inputManager.registerProvider(keyboardProvider);

// Create and add input system
const inputSystem = new InputSystem(inputManager);
game.addSystem(inputSystem);
```

### AIBehaviorSystem

The AIBehaviorSystem manages AI entity behavior and movement patterns. It processes entities with AI, Transform, and CharacterController components.

#### Supported Behaviors

- **Chase**: Direct pursuit of target
- **Flank**: Circular movement around target with approach
- **Keep Distance**: Maintains optimal range from target
- **Idle**: No movement, but still aims at target

#### Implementation Details

- Uses Vector2 for position and direction calculations
- Maintains optimal distance for ranged behavior (300 pixels)
- Updates both movement and aim direction
- Implements smooth flanking with weighted direction vectors

## Usage Examples

```typescript
// Entity setup with AI behavior
const entity = new Entity();
entity.addComponent(new AI());
entity.addComponent(new Transform());
entity.addComponent(new CharacterController());

// Configure AI behavior
const ai = entity.getComponent("ai") as AI;
ai.setState("chase"); // or 'flank', 'keepDistance', 'idle'
ai.setTarget({ position: targetPosition, type: "player" });
```

## Updates and Changes

### [2024-03-19]

- Updated import paths to use @engine alias
- Removed unused deltaTime parameter from update method
- Added comprehensive documentation
- Added InputSystem for managing input state updates
- Improved system integration with game loop
