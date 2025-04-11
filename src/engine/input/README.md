# Input System

A flexible and extensible input handling system that provides a unified interface for various input methods including keyboard, mouse, touch, and gamepad controls.

## Directory Structure

- `types.ts` - Core types and interfaces for the input system
- `InputManager.ts` - Main input management class
- `InputManager.test.ts` - Test suite for input management
- `KeyboardInputProvider.ts` - Keyboard input implementation
- `KeyboardInputProvider.test.ts` - Test suite for keyboard input
- `MouseInputProvider.ts` - Mouse input implementation
- `MouseInputProvider.test.ts` - Test suite for mouse input
- `TouchInputProvider.ts` - Touch input implementation
- `README.md` - This documentation file

## Components/Features

### Input Manager

- Unified interface for all input methods
- Input action mapping system
- Input buffering for smoother response
- Event system for input state changes
- Support for multiple simultaneous input methods
- Axis and button input handling
- Normalized vector support for consistent movement

### Keyboard Input Provider

- WASD and Arrow key movement support
- Multiple key bindings per action
- Key press duration tracking
- Normalized diagonal movement
- Configurable key mappings

### Mouse Input Provider

- Left/right click support
- Mouse position tracking
- Canvas-relative coordinates
- Normalized aim vectors
- Movement delta tracking
- Context menu prevention

### Touch Input Provider

- Dual virtual joysticks for movement and aiming
- Configurable touch zones and joystick behavior
- Touch duration tracking for button states
- Multi-touch support
- Deadzone handling for improved precision

### Input Types

- **Vector2** - 2D vector representation for positions and directions
- **InputAxis** - Represents directional input with normalized values
- **ButtonState** - Tracks press/release states and durations
- **InputAction** - Standard game actions that can be mapped to inputs
- **InputDeviceType** - Supported input device types

## Implementation Details

### Key Design Patterns

- **Observer Pattern** - Used for input event notifications
- **Strategy Pattern** - Different input providers for each device type
- **Facade Pattern** - InputManager provides a simplified interface for input handling

### Input Processing Flow

1. Input providers collect raw input data
2. InputManager processes and normalizes inputs
3. Input buffering is applied for smoother response
4. Events are dispatched to subscribers
5. Game systems query current input state

## Usage Examples

### Setting Up Input System

```typescript
// Create input manager
const inputManager = new InputManager();

// Set up providers
const canvas = document.querySelector("canvas");
const keyboardProvider = new KeyboardInputProvider();
const mouseProvider = new MouseInputProvider(canvas);
const touchProvider = new TouchInputProvider(canvas);

// Register providers
inputManager.registerProvider(keyboardProvider);
inputManager.registerProvider(mouseProvider);
inputManager.registerProvider(touchProvider);
```

### Handling Player Movement

```typescript
const playerController = {
  onInputAxisChange: (action: InputAction, value: InputAxis) => {
    if (action === InputAction.Move) {
      // Move player using WASD/Arrow keys
      player.move(value.normalized);
    } else if (action === InputAction.Aim) {
      // Rotate player to face mouse position
      player.aim(value.normalized);
    }
  },
};

inputManager.subscribe(playerController);
```

### Handling Actions

```typescript
const combatController = {
  onInputActionStart: (action: InputAction) => {
    switch (action) {
      case InputAction.PrimaryAction:
        // Left click or Space to attack
        player.attack();
        break;
      case InputAction.SecondaryAction:
        // Right click or Shift to block
        player.block();
        break;
      case InputAction.Interact:
        // E or Enter to interact
        player.interact();
        break;
    }
  },
};

inputManager.subscribe(combatController);
```

## Updates and Changes

### [2024-03-19] - Task #3.2

- Added keyboard input provider with WASD/Arrow key support
- Added mouse input provider with aim and click support
- Implemented comprehensive test suites for both providers
- Features added:
  - Multiple key bindings
  - Mouse position tracking
  - Normalized aim vectors
  - Movement delta tracking
  - Canvas-relative coordinates
  - Context menu handling

### [2024-03-19] - Task #3.1

- Added core input system types and interfaces
- Implemented InputManager with support for multiple providers
- Added input buffering system
- Created comprehensive test suite
- Features added:
  - Multi-provider support
  - Input action mapping
  - Input buffering
  - Event system
  - Axis and button handling
  - Normalized vector support

### [2024-03-19] - Task #3.3

- Added TouchInputProvider for mobile device support
- Implemented virtual joysticks for movement and aiming
- Added touch input configuration options
- Added comprehensive test coverage for touch input
- Updated documentation with touch input details

## Best Practices

1. Always dispose input providers when no longer needed
2. Check input availability before using device-specific features
3. Use normalized input values for consistent behavior
4. Handle touch events properly to prevent default browser actions
5. Test input handling with various device capabilities

## Dependencies

- Core input types and interfaces from `types.ts`
- DOM APIs for touch event handling
- Canvas element for touch coordinate mapping

## Performance Considerations

- Touch event handlers use bound methods to prevent recreation
- Touch state updates are optimized for minimal object creation
- Uses Maps for efficient touch point and duration tracking
- Implements proper cleanup to prevent memory leaks
