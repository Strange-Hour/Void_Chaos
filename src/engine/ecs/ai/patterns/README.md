# AI Movement Patterns System

This directory implements the extensible, state-machine-driven movement pattern system for enemy AI. Each movement pattern (e.g., chase, retreat, flank, idle, search) is a class, and enemies use a state machine to switch between movement states based on context and conditions. **All navigation patterns use A\* pathfinding for obstacle avoidance.**

---

## Directory Structure

```
src/engine/ecs/ai/patterns/
├── ChasePattern.ts        # Direct pursuit logic
├── FlankPattern.ts        # Flanking/arc movement logic
├── RetreatPattern.ts      # Maintain distance/retreat logic
├── IdlePattern.ts         # No movement
├── SearchPattern.ts       # Search/wander logic
├── StateMachine.ts        # State machine implementation
├── index.ts               # Pattern registry
├── types.ts               # Type definitions
├── utils/                 # Pattern utilities (distance, debug, etc.)
│   ├── debugSearchState.ts
│   ├── getDistanceToTarget.ts
│   ├── getPlayerDistance.ts
│   ├── isPlayerDetected.ts
│   ├── lineOfSight.ts
│   └── retreatPatternParams.ts
├── conditions/            # Transition condition helpers
│   ├── combinators.ts
│   ├── distance.ts
│   ├── lineOfSight.ts
│   └── types.ts
└── README.md              # This documentation
```

---

## Components & Features

### 1. **Movement Patterns**

- **ChasePattern**: Moves directly toward the target using A\* pathfinding.
- **FlankPattern**: Attempts to move around/behind the target, using arc and perpendicular movement, with pathfinding.
- **RetreatPattern**: Maintains a specific distance from the target, retreating, approaching, or strafing as needed.
- **IdlePattern**: No movement; used for waiting or stunned states.
- **SearchPattern**: Wanders randomly within a radius of the last known player position, using pathfinding.

### 2. **Pattern Registry**

- `index.ts` maps pattern type strings (e.g., 'chase', 'flank') to their implementations.
- Add new patterns by creating a file and registering it in `index.ts`.

### 3. **State Machine**

- `StateMachine.ts` implements a runtime state machine for enemy movement.
- Each enemy type defines a `movementStateMachine` (see enemy type files) with:
  - `initial`: starting state
  - `states`: available states and their patterns
  - `transitions`: transition rules and conditions

### 4. **Transition Conditions**

- Located in `conditions/` (e.g., `distance.ts`, `lineOfSight.ts`, `combinators.ts`).
- Used to define when an enemy should switch states (e.g., lose sight of player, get too close, etc).

---

## Implementation Details

- **Entity-Component-System (ECS):** Modular, flexible AI behaviors via ECS.
- **State Machines:** Each enemy uses a state machine to manage movement logic, enabling dynamic switching between behaviors.
- **Pattern-Driven AI:** Movement logic is encapsulated in pluggable pattern classes.
- **A\* Pathfinding:** All movement patterns use A\* for obstacle avoidance.
- **Extensibility:** Add new patterns and states with minimal code changes.
- **Data-Driven Design:** Enemy behaviors are defined in data (state machines and pattern configs), not hardcoded.

---

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

---

## State Machine & Transitions

Each enemy type defines a state machine with states and transitions. Example:

```typescript
movementStateMachine: {
  initial: 'idle',
  states: [
    { state: 'idle', pattern: { type: 'idle' } },
    { state: 'chase', pattern: { type: 'chase', targetType: 'player' } },
    { state: 'search', pattern: { type: 'search', searchRadius: 128 } },
  ],
  transitions: [
    { from: 'idle', to: 'chase', condition: idleToChase },
    { from: 'idle', to: 'search', condition: idleToSearch },
    { from: 'chase', to: 'search', condition: chaseToSearch },
    { from: 'search', to: 'idle', condition: searchToIdle },
    { from: 'chase', to: 'idle', condition: chaseToIdle },
  ],
}
```

### Dolphin Diagram: Example State Transitions

```
+-------+     idleToChase     +-------+     chaseToSearch     +--------+
| Idle  |------------------->| Chase |---------------------->| Search |
+-------+                    +-------+                      +--------+
   |  ^                        |  ^                            |  ^
   |  |                        |  |                            |  |
   |  +------idleToSearch------+  +------chaseToIdle-----------+  +--searchToIdle--+
```

- **States:** idle, chase, search, retreat, flank, etc.
- **Transitions:** Defined by conditions (distance, line of sight, etc).

---

## Usage Examples

### Implementing a New Pattern

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

### Registering a Pattern

```typescript
import { ZigZagPattern } from './ZigZagPattern';
export const MovementPatternRegistry = {
  ...,
  'zigzag': new ZigZagPattern(),
};
```

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
