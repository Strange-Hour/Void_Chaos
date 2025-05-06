# Enemy Types and State Machines

This directory defines all enemy types, their configuration, and their state machine-driven AI behaviors for the game. Each enemy type specifies its own movement state machine, which determines how it transitions between behaviors like idle, chase, search, retreat, and flank.

---

## Directory Structure

```
src/engine/ecs/enemies/
├── EnemyManager.ts         # Manages all enemy entities in the game
├── EnemyRegistry.ts        # Registers and provides access to all enemy types
├── types/                  # Enemy type definitions
│   ├── BasicEnemy.ts       # Basic enemy type
│   ├── FlankerEnemy.ts     # Flanker enemy type
│   ├── RangedEnemy.ts      # Ranged enemy type
│   ├── BomberEnemy.ts      # Bomber enemy type
│   └── IEnemyTypeDefinition.ts # Enemy type interface
└── README.md               # This documentation
```

---

## Enemy Type Overview

Each enemy type implements the `IEnemyTypeDefinition` interface, specifying:

- **id**: Unique string identifier
- **name**: Human-readable name
- **color**: Display color
- **config**: Stats (speed, health, damage, detection/attack range, score value)
- **behavior**: Attack cooldown and other behavior-specific properties
- **patrolRadius**: (Optional) How far the enemy will wander when searching
- **movementStateMachine**: State machine definition (states, transitions, patterns)

---

## Enemy State Machines

Below is a breakdown of each enemy's state machine, including a dolphin diagram for state transitions.

### 1. Basic Enemy

- **States:** idle, chase, search
- **Patterns:**
  - idle: No movement
  - chase: Pursue player
  - search: Wander near last known player position
- **Transitions:**
  - idle → chase: Player detected and visible
  - idle → search: Player detected but not visible
  - chase → search: Player lost or out of range
  - search → idle: Player found again
  - chase → idle: Player within attack range

#### Dolphin Diagram

```
+-------+     idleToChase     +-------+     chaseToSearch     +--------+
| Idle  |------------------->| Chase |---------------------->| Search |
+-------+                    +-------+                      +--------+
   |  ^                        |  ^                            |  ^
   |  |                        |  |                            |  |
   |  +------idleToSearch------+  +------chaseToIdle-----------+  +--searchToIdle--+
```

#### State Machine Definition

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

---

### 2. Flanker Enemy

- **States:** idle, flank, search, chase
- **Patterns:**
  - idle: No movement
  - flank: Move around/behind player
  - search: Wander near last known player position
  - chase: Pursue player
- **Transitions:**
  - idle → flank: Player detected and visible
  - idle → search: Player detected but not visible
  - flank → search: Player lost or out of range
  - search → idle: Player found again
  - flank → chase: Player within attack range
  - chase → flank: Player detected and visible

#### Dolphin Diagram

```
+-------+     idleToFlank     +--------+     flankToSearch     +--------+
| Idle  |------------------->| Flank  |---------------------->| Search |
+-------+                    +--------+                      +--------+
   |  ^                        |  ^                            |  ^
   |  |                        |  |                            |  |
   |  +------idleToSearch------+  +------flankToChase----------+  +--searchToIdle--+
   |                             |  ^
   |                             |  |
   +-----------------------------+  +--chaseToFlank--+
```

#### State Machine Definition

```typescript
movementStateMachine: {
  initial: 'idle',
  states: [
    { state: 'idle', pattern: { type: 'idle' } },
    { state: 'flank', pattern: { type: 'flank', targetType: 'player', flankWeight: 0.4, idealDistance: 100, distanceMargin: 50 } },
    { state: 'search', pattern: { type: 'search', searchRadius: 160 } },
    { state: 'chase', pattern: { type: 'chase', targetType: 'player' } },
  ],
  transitions: [
    { from: 'idle', to: 'flank', condition: idleToFlank },
    { from: 'idle', to: 'search', condition: idleToSearch },
    { from: 'flank', to: 'search', condition: flankToSearch },
    { from: 'search', to: 'idle', condition: searchToIdle },
    { from: 'flank', to: 'chase', condition: flankToChase },
    { from: 'chase', to: 'flank', condition: chaseToFlank },
  ],
}
```

---

### 3. Ranged Enemy

- **States:** idle, retreat, search
- **Patterns:**
  - idle: No movement
  - retreat: Maintain distance from player, strafe if in ideal zone
  - search: Wander near last known player position
- **Transitions:**
  - idle → retreat: Player detected and visible
  - idle → search: Player detected but not visible
  - retreat → idle: Player within attack range
  - retreat → search: Player lost or out of range
  - search → idle: Player found again

#### Dolphin Diagram

```
+-------+     idleToRetreat     +---------+     retreatToSearch     +--------+
| Idle  |--------------------->| Retreat |------------------------>| Search |
+-------+                      +---------+                        +--------+
   |  ^                           |  ^                                |  ^
   |  |                           |  |                                |  |
   |  +------idleToSearch---------+  +------retreatToIdle-------------+  +--searchToIdle--+
```

#### State Machine Definition

```typescript
movementStateMachine: {
  initial: 'idle',
  states: [
    { state: 'idle', pattern: { type: 'idle' } },
    { state: 'retreat', pattern: { type: 'retreat', targetType: 'player', idealDistance: 350, followThreshold: 500, distanceMargin: 100, minDistance: 200, maxDistance: 450, strafeEnabled: true } },
    { state: 'search', pattern: { type: 'search', searchRadius: 192 } },
  ],
  transitions: [
    { from: 'idle', to: 'retreat', condition: idleToRetreat },
    { from: 'idle', to: 'search', condition: idleToSearch },
    { from: 'retreat', to: 'idle', condition: retreatToIdle },
    { from: 'retreat', to: 'search', condition: retreatToSearch },
    { from: 'search', to: 'idle', condition: searchToIdle },
  ],
}
```

---

### 4. Bomber Enemy

- **States:** idle, chase, search
- **Patterns:**
  - idle: No movement
  - chase: Pursue player
  - search: Wander near last known player position
- **Transitions:**
  - idle → chase: Player detected and visible
  - idle → search: Player detected but not visible
  - chase → search: Player lost or out of range
  - search → idle: Player found again
  - chase → idle: Player within attack range

#### Dolphin Diagram

```
+-------+     idleToChase     +-------+     chaseToSearch     +--------+
| Idle  |------------------->| Chase |---------------------->| Search |
+-------+                    +-------+                      +--------+
   |  ^                        |  ^                            |  ^
   |  |                        |  |                            |  |
   |  +------idleToSearch------+  +------chaseToIdle-----------+  +--searchToIdle--+
```

#### State Machine Definition

```typescript
movementStateMachine: {
  initial: 'idle',
  states: [
    { state: 'idle', pattern: { type: 'idle' } },
    { state: 'chase', pattern: { type: 'chase', targetType: 'player' } },
    { state: 'search', pattern: { type: 'search', searchRadius: 96 } },
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

---

## See Also

- `EnemyManager.ts` for enemy management logic
- `EnemyRegistry.ts` for enemy type registration
- `types/` for all enemy type definitions
- [../ai/patterns/README.md](../ai/patterns/README.md) for movement pattern and state machine details
