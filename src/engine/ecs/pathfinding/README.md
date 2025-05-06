# Pathfinding System

This module provides grid-based pathfinding utilities for AI navigation in the game. It is designed to work with the extensible movement pattern system, allowing different enemy types to use custom pathfinding and movement strategies. **The AI system now computes A\* paths for all movement patterns that require navigation, and passes the next waypoint to the pattern for obstacle avoidance.**

## Overview

- **Grid.ts**: Implements a 2D grid for pathfinding, with A\* algorithm support.
- **Integration**: The grid and pathfinding logic are used by AI movement patterns (see `@patterns`) to determine how enemies move toward or around targets. The AI system computes the path and provides the next waypoint to the movement pattern.

## Dolphin Diagram: AI & Pathfinding Flow

```
+-------------------+      +-------------------+      +-------------------+      +-------------------+
|   Enemy Entity    | ---> |   AI System       | ---> | Pathfinding/Grid  | ---> | Movement Pattern  |
+-------------------+      +-------------------+      +-------------------+      +-------------------+
        |                        |                           |                           |
        | 1. Get target pos      |                           |                           |
        |----------------------->|                           |                           |
        |                        | 2. Find path (A*)         |                           |
        |                        |-------------------------->|
        |                        |                           | 3. Return path/waypoint   |
        |                        |<--------------------------|
        | 4. Pass nextWaypoint   |                           |
        |----------------------->|                           |
        |                        | 5. Move toward waypoint   |                           |
        |<-----------------------|                           |
```

## Integration with Movement Patterns

The pathfinding system is used by movement patterns to:

- Find a path from an enemy to a target (e.g., player)
- Support advanced behaviors (e.g., flanking, searching, retreating)
- Allow each enemy to use a different movement strategy by plugging in a different pattern
- **All movement patterns that require navigation now use the nextWaypoint provided by the AI system for obstacle avoidance.**

### Example Usage in a Movement Pattern

```typescript
// The AI system computes the path and provides nextWaypoint in context
if (context.nextWaypoint) {
  // Move toward next waypoint
}
```

## Extending the System

- To add a new movement pattern that uses pathfinding, implement the `IMovementPattern` interface in `@patterns` and use the grid/pathfinding utilities as needed.
- The AI system will provide the grid context and nextWaypoint to each pattern.

## Example: Flanking with Pathfinding

A flanking pattern might use the grid to find a path to a position behind the player, and the AI system will pass the next waypoint to the pattern:

```typescript
const behindPlayerCell = ... // calculate cell behind player
const path = Pathfinding.findPath(grid, enemyCell, behindPlayerCell);
const nextWaypoint = path[1]; // AI system provides this to the pattern
```

## State Machine Integration

Each enemy can have a state machine that determines which movement pattern to use (e.g., chase, search, retreat). Each pattern can use the pathfinding system differently, or not at all.

- **Chase**: Pathfind directly to the player
- **Flank**: Pathfind to a flanking position
- **Retreat**: Pathfind away from the player
- **Search**: Wander or patrol using the grid

## Game Development Concepts

- **Entity-Component-System (ECS):** Modular architecture for flexible AI and world logic.
- **A\* Pathfinding Algorithm:** Efficiently finds shortest paths on a grid, used for all enemy navigation.
- **Grid Navigation:** The world is discretized into a grid for efficient pathfinding and obstacle avoidance.
- **Pattern-Driven AI:** Each enemy can use a different movement pattern, which now always uses the next waypoint for navigation.
- **Extensibility:** New movement patterns and pathfinding strategies can be added with minimal code changes.
- **State Machine Integration:** The AI system coordinates state transitions and pathfinding for each enemy.

## See Also

- `@patterns` for movement pattern implementations
- `@engine/ecs/ai/patterns/types.ts` for type definitions
