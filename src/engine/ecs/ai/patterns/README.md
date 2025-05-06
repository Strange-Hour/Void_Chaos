# AI Movement Patterns System

This directory contains the extensible movement pattern system for enemy AI. Each movement pattern (e.g., chase, retreat, flank, idle) is implemented as a class, and enemies use a state machine to switch between movement states based on context. **All movement patterns that require navigation now use A\* pathfinding via the nextWaypoint provided in their context, ensuring obstacle avoidance.**

## Overview

- **Patterns**: Each file implements a movement pattern as a class conforming to `IMovementPattern`.
- **Pattern Registry**: `index.ts` maps pattern type strings to their implementations.
- **State Machines**: Each enemy type defines a `movementStateMachine` listing available states and their patterns.
- **A\* Pathfinding Integration**: The AI system computes a path using the grid and A\* algorithm, passing the next waypoint to the movement pattern for obstacle-aware movement.
- **Extensibility**: Add new patterns by creating a new file and registering it in `index.ts`.

> **Note:** The AIBehaviorSystem now delegates all movement logic to the pattern system and contains no direct movement logic for chase, flank, retreat, etc. All such logic is handled by pluggable pattern classes.

## Dolphin Diagram: System Flow

```
+-------------------+      +-------------------+      +-------------------+      +-------------------+
|   Enemy Entity    | ---> |   AI System       | ---> | Pathfinding/Grid  | ---> | Movement Pattern  |
+-------------------+      +-------------------+      +-------------------+      +-------------------+
        |                        |                           |                           |
        | 1. Get state machine   |                           |                           |
        |----------------------->|                           |                           |
        |                        | 2. Compute path (A*)      |                           |
        |                        |-------------------------->|                           |
        |                        |                           | 3. Return path/waypoint   |
        |                        |<--------------------------|                           |
        | 4. Select pattern      |                           |                           |
        |----------------------->|                           |                           |
        |                        | 5. Pass nextWaypoint      |                           |
        |                        |-------------------------->|                           |
        |                        |                           | 6. Compute direction      |
        |                        |<--------------------------|                           |
        | 7. Move/act            |                           |                           |
        |<-----------------------|                           |                           |
```

## How It Works

1. **Enemy Definition**: Each enemy type specifies a `movementStateMachine` with an initial state and a list of states, each referencing a pattern.
2. **AI System**: The AI system tracks the current state for each enemy, evaluates transitions, computes a path using A\* (if needed), and invokes the correct pattern's logic with the next waypoint.
3. **Pattern Logic**: Each pattern receives the entity, target, and context (including grid, path, and nextWaypoint) and returns a movement direction. If a path is provided, the pattern moves toward the next waypoint for obstacle avoidance.

## Adding a New Pattern

1. Create a new file (e.g., `ZigZagPattern.ts`) implementing `IMovementPattern`.
2. Register the pattern in `index.ts` with a unique key.
3. Reference the key in enemy `movementStateMachine` definitions.

## Example: Enemy State Machine (with Search)

```typescript
movementStateMachine: {
  initial: 'chase',
  states: [
    { state: 'chase', pattern: { type: 'chase', targetType: 'player' } },
    { state: 'search', pattern: { type: 'search', searchRadius: 160 } },
    { state: 'flank', pattern: { type: 'flank', targetType: 'player', flankWeight: 0.4 } },
    { state: 'retreat', pattern: { type: 'retreat', targetType: 'player', idealDistance: 300, followThreshold: 400 } },
    { state: 'idle', pattern: { type: 'idle' } },
  ],
}
```

## Example: Implementing a Pattern

```typescript
import { IMovementPattern, MovementPatternContext } from "./types";
import { Entity } from "@engine/ecs/Entity";
import { Vector2 } from "@engine/math/Vector2";

export class ZigZagPattern implements IMovementPattern {
  getMoveDirection(
    entity: Entity,
    target: Entity,
    context: MovementPatternContext
  ): Vector2 {
    // Use context.nextWaypoint for obstacle avoidance
    if (context.nextWaypoint) {
      // Move toward next waypoint
    }
    // Custom zig-zag logic here
    return { x: 1, y: 0 };
  }
}
```

## Dolphin Diagram: Pattern Registry

```
+-------------------+
| Pattern Registry  |
+-------------------+
| 'chase'  -> ChasePattern   |
| 'flank'  -> FlankPattern   |
| 'retreat'-> RetreatPattern |
| 'idle'   -> IdlePattern    |
| ...      -> ...            |
+-------------------+
```

## Transition Logic

- The AI system is responsible for determining when to switch states (e.g., chase → search if player is lost).
- Transitions can be hardcoded or data-driven.

## Game Development Concepts

- **Entity-Component-System (ECS):** The world is built using ECS, where entities are composed of components and updated by systems. This allows for flexible, modular AI behaviors.
- **State Machines:** Each enemy uses a state machine to manage its movement logic, enabling dynamic switching between behaviors (chase, search, retreat, etc.).
- **Pattern-Driven AI:** Movement logic is encapsulated in pluggable pattern classes, making it easy to add, test, and reuse behaviors.
- **A\* Pathfinding Integration:** The AI system computes paths using the grid and A\* algorithm, and all movement patterns use the next waypoint for obstacle avoidance.
- **Extensibility:** New movement patterns and states can be added with minimal code changes, supporting rapid iteration and experimentation.
- **Data-Driven Design:** Enemy behaviors are defined in data (state machines and pattern configs), not hardcoded, supporting designer-friendly workflows.

## See Also

- `types.ts` for type definitions
- `index.ts` for the pattern registry
- Enemy type files for state machine examples

## SearchPattern

- The `search` pattern causes the enemy to wander randomly within a radius of the last known player position.
- The radius is set by `searchRadius` (pattern), `patrolRadius` (enemy), or `detectionRange` (enemy).
- The pattern sets `__isSearching` and `__patrolRadius` on the entity for debug rendering (see DebugSystem).
- If no valid wander target is found, the enemy stays idle.

### Debug Rendering

- When in search mode, the debug overlay will show a search radius around the enemy.
