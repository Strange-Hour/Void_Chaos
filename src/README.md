# Source Directory Structure

This directory contains the core components of our game engine and application. The structure is organized into two main directories:

## Directory Structure

### `/engine`

Contains the core game engine components, implementing fundamental game development concepts and systems. This includes:

- Entity Component System (ECS)
- Rendering system
- Math utilities
- Game loop management
- Sprite and asset management
- Camera system
- Layer management for rendering

### `/app`

Contains the Next.js application that serves as the game's frontend interface. This includes:

- React components
- Page layouts
- Routing
- Global styles
- UI components

## Organization Philosophy

The separation between `engine` and `app` follows the principle of separation of concerns:

1. **Engine Layer**: Pure game logic and systems, independent of any specific UI framework

   - Handles core game mechanics
   - Manages game state
   - Processes game loop
   - Handles rendering
   - Manages assets

2. **Application Layer**: User interface and game presentation
   - Provides the game container
   - Handles user input
   - Manages UI overlays
   - Handles routing and navigation
   - Provides debug interfaces

This separation allows for:

- Independent testing of game logic
- Easier maintenance and updates
- Clear boundaries between game systems and UI
- Potential reuse of the engine in different contexts
- Better performance optimization for each layer
