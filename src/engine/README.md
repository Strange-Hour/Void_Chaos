# Game Engine Directory

This directory contains the core game engine components, implementing essential game development concepts and systems.

## Directory Structure

### Core Files

- `Game.ts`: Central game loop and state management
- `Canvas.ts`: WebGL-based rendering system
- `Camera.ts`: Camera system for viewport management
- `Sprite.ts`: Sprite management and rendering
- `Layer.ts`: Layer-based rendering system
- `SpriteManager.ts`: Asset management for sprites

### Subdirectories

- `/ecs`: Entity Component System implementation
- `/math`: Mathematical utilities for game development

## Game Development Concepts

### Game Loop (`Game.ts`)

- Fixed timestep game loop implementation
- State management and updates
- Input handling and event system
- Scene management

### Rendering System (`Canvas.ts`)

- WebGL-based rendering pipeline
- Batch rendering for performance
- Shader management
- Texture handling
- Transform management

### Camera System (`Camera.ts`)

- Viewport management
- World-to-screen coordinate transformation
- Camera movement and zooming
- Culling and frustum calculations

### Sprite System (`Sprite.ts`, `SpriteManager.ts`)

- Texture-based sprite rendering
- Sprite sheet management
- Animation system
- Asset loading and caching
- Memory management for textures

### Layer System (`Layer.ts`)

- Z-order rendering
- Layer-based visibility control
- Performance optimization through layer management
- Composite rendering effects

### Entity Component System (`/ecs`)

- Component-based architecture
- Entity management
- System processing
- Component data storage
- Query and filter systems

### Math Utilities (`/math`)

- Vector operations
- Matrix transformations
- Collision detection
- Physics calculations
- Random number generation

## Testing

Each major component has a corresponding test file (`.test.ts`) that verifies:

- Core functionality
- Edge cases
- Performance characteristics
- Integration with other systems

## Design Philosophy

The engine follows these key principles:

1. **Performance First**: Optimized for 2D game rendering
2. **Modularity**: Components can be used independently
3. **Extensibility**: Easy to add new features and systems
4. **Type Safety**: Full TypeScript implementation
5. **Testing**: Comprehensive test coverage

## Usage

The engine components are designed to be used together but can be used independently:

```typescript
// Example usage
const game = new Game();
const camera = new Camera();
const sprite = new Sprite(texture);

game.addSystem(new RenderSystem());
game.addEntity(sprite);

game.start();
```
