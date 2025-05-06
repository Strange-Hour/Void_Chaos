# Pathfinding System & Enemy AI Integration

## Overview

This directory contains the core grid-based pathfinding system used by the game's AI to navigate the world, avoid obstacles, and pursue or evade the player. The pathfinding system is tightly integrated with the Enemy AI system, enabling a variety of enemy behaviors such as chasing, flanking, retreating, and patrolling.

---

## Grid System (`Grid.ts`)

The `Grid` class represents a 2D grid map of the world, where each cell is either walkable or blocked. The grid is used for pathfinding and is updated dynamically based on the positions of static obstacles (e.g., walls, blocks).

- **Cell Size:** Each cell represents a square region in world units (pixels).
- **Walkability:** Cells can be marked as walkable or blocked.
- **World ↔ Grid Conversion:** Methods are provided to convert between world coordinates and grid cell coordinates.

**Key Methods:**

- `setWalkable(x, y, walkable)` — Mark a cell as walkable or blocked.
- `isWalkable(x, y)` — Check if a cell is walkable.
- `worldToGrid(wx, wy)` — Convert world coordinates to grid cell coordinates.
- `gridToWorld(x, y)` — Convert grid cell coordinates to world coordinates (center of cell).

---

## Pathfinding Algorithm (`Pathfinding.findPath`)

The pathfinding system uses the **A\*** (A-star) algorithm to find the shortest path between two points on the grid, considering obstacles.

- **Inputs:**
  - `grid`: The `Grid` instance.
  - `start`: Starting cell `{x, y}`.
  - `goal`: Target cell `{x, y}`.
- **Output:**
  - An array of `{x, y}` grid cells representing the path, or an empty array if no path is found.
- **Heuristic:** Manhattan distance (good for 4-way movement).
- **Neighbors:** Only up, down, left, right (no diagonals).

**A\* Dolphin Diagram:**

```
+-------------------+
|   Pathfinding     |
+-------------------+
| 1. Get start/goal |
| 2. Open set       |
| 3. Loop:          |
|   - Pick lowest f |
|   - If goal: done |
|   - Add neighbors |
+-------------------+
```

---

## Integration with Enemy AI (`AIBehaviorSystem.ts`)

The `AIBehaviorSystem` is responsible for updating enemy movement and behavior each frame. It uses the pathfinding system to determine how enemies should move toward or away from the player, or patrol/search when the player is not visible.

### How It Works:

1. **Targeting:** Each enemy AI targets the player (or last known player position).
2. **Path Calculation:**
   - The enemy's current position and the target's position are converted to grid cells.
   - `Pathfinding.findPath` is called to get a path.
   - If the player is unreachable, the enemy may switch to searching/patrolling mode.
3. **Movement:**
   - The enemy follows the path, moving toward the next waypoint.
   - If searching, the enemy may wander within a patrol radius.
4. **Pattern Switching:**
   - Enemy types define movement patterns (chase, flank, retreat, idle).
   - The AI system can switch patterns based on context (e.g., player lost, low health).

**AI/Pathfinding Dolphin Diagram:**

```
+-------------------+      +-------------------+      +-------------------+
|   Enemy Entity    | ---> | AIBehaviorSystem  | ---> | Pathfinding/Grid  |
+-------------------+      +-------------------+      +-------------------+
        |                        |                           |
        | 1. Get player pos      |                           |
        |----------------------->|                           |
        |                        | 2. Find path              |
        |                        |-------------------------->|
        |                        |                           | 3. Return path
        |                        |<--------------------------|
        | 4. Move along path     |                           |
        |<-----------------------|                           |
```

---

## Enemy Type Patterns (`types/`)

Enemy types define their movement and behavior patterns using the `IEnemyTypeDefinition` interface. Each type can have multiple movement patterns, such as:

- **Chase:** Move directly toward the player.
- **Flank:** Move around the player, maintaining a certain distance.
- **Retreat:** Keep a distance from the player (used by ranged enemies).
- **Idle:** Stand still or patrol.

**Example: BasicEnemy**

```typescript
export const BasicEnemy: IEnemyTypeDefinition = {
  id: "basic",
  // ...
  behavior: {
    movementPatterns: {
      chase: { type: "chase", targetType: "player" },
      idle: { type: "idle" },
    },
    initialPatternId: "chase",
  },
  patrolRadius: 128,
};
```

**Example: RangedEnemy**

```typescript
export const RangedEnemy: IEnemyTypeDefinition = {
  id: "ranged",
  // ...
  behavior: {
    movementPatterns: {
      keep_distance: {
        type: "retreat",
        targetType: "player",
        idealDistance: 350,
        followThreshold: 500,
        distanceMargin: 100,
      },
      idle: { type: "idle" },
    },
    initialPatternId: "keep_distance",
  },
  patrolRadius: 192,
};
```

---

## Game Development Concepts

- **Entity-Component-System (ECS):** The world is built using ECS, where entities are composed of components and updated by systems.
- **Pathfinding Grid:** The world is discretized into a grid for efficient pathfinding and obstacle avoidance.
- **A\* Algorithm:** A classic pathfinding algorithm used in many games for its efficiency and optimality.
- **AI Patterns:** Enemies can switch between different movement patterns for more dynamic and challenging behavior.
- **Patrol/Search Radius:** When the player is lost, enemies can wander within a defined radius of the last known player position.
- **Dynamic Obstacles:** The grid is updated whenever obstacles are added/removed, ensuring up-to-date pathfinding.

---

## File References

- [`Grid.ts`](./Grid.ts): Grid and pathfinding implementation
- [`AIBehaviorSystem.ts`](../systems/AIBehaviorSystem.ts): Enemy AI logic and pathfinding integration
- [`types/`](../enemies/types/): Enemy type and pattern definitions
- [`World.ts`](../World.ts): World management and grid updates
- [`ai/patterns/types.ts`](../ai/patterns/types.ts): AI movement pattern interfaces

---

## Further Reading

- [A\* Pathfinding Algorithm (Wikipedia)](https://en.wikipedia.org/wiki/A*_search_algorithm)
- [Entity Component System (ECS) Pattern](https://en.wikipedia.org/wiki/Entity_component_system)
- [Game AI Movement Patterns](https://gameprogrammingpatterns.com/)
