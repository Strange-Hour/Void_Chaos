# Product Requirements Document (PRD)

## Title: **Void Chaos**

**Version:** 1.2

---

## 1. Executive Summary

**Void Chaos** is a browser-based, sci-fi horror survival roguelite with real-time action and up to **4-player online co-op**. Set in abandoned research stations, corrupted alien megastructures, and temporal voids, players must rely on each other — and evolving weapons — to survive endless waves of mutating horrors. With web-native performance via **TypeScript**, **React**, and **Next.js**, it brings horror-fueled chaos straight to the browser.

> **Major update:** Real-time **online co-op** mode for up to **4 players** is a **core requirement**. Cooperative sessions include shared progress, synchronized enemies, synergy abilities, and scalable difficulty.

---

## 2. Target Platform(s)

| Platform      | Details                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| **Primary**   | Web Browsers (Chrome, Firefox, Safari, Edge)                            |
| **Secondary** | Progressive Web App (PWA) for installable mobile/desktop experiences    |
| **Optional**  | Electron/Capacitor wrappers for native-like desktop/mobile distribution |

---

## 3. Technology Stack

| Technology              | Purpose                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| **Next.js**             | App framework for routing, SSR, static generation                  |
| **React**               | Component-based UI                                                 |
| **TypeScript**          | Safe static typing                                                 |
| **Canvas API**          | Rendering 2D game world and entities                               |
| **WebRTC / WebSockets** | Real-time online multiplayer, peer-to-peer or server-authoritative |
| **Socket.IO / tRPC**    | Multiplayer synchronization layer                                  |
| **Zustand**             | State management across sessions                                   |
| **IndexedDB**           | Persisted saves                                                    |
| **Web Audio API**       | Immersive horror soundscapes                                       |
| **TailwindCSS**         | Utility-first UI styling                                           |
| **Service Workers**     | Offline/PWA support                                                |

---

## 4. Game Overview

**Genre:** Sci-fi Horror Roguelite, Action, Multiplayer  
**Perspective:** Top-down, 2D  
**Session Length:** 15–30 minutes per run  
**Core Mode:** Solo or **1–4 player online co-op**  
**Setting:** Mutated alien biomes, void-warped stations, cursed moons

---

## 5. Gameplay Systems

### 5.1 Movement & Combat

- **Inputs:** Keyboard, gamepad, mobile touch
- **Combat:** Auto-triggered weapons, team auras, enemy scaling with player count
- **Networked Sync:** Player states, entities, damage events, drops synced in real time
- **Player Revival:** Co-op revives possible using energy pulses from allies

### 5.2 Multiplayer Features

- **Lobby System:** Create/join public or private lobbies (hosted via WebSocket)
- **Session Sync:** Enemies, XP gems, drops, chests, events synced across clients
- **Shared Objectives:** Shared wave timers, co-op-only relics
- **Ping / Voice:** Optional lightweight ping system and voice hooks (Phase 2)

---

## 6. Characters (Survivors)

- 50+ survivors with unique origins (psychic, cybernetic, alien hybrid)
- Each player selects a survivor with:
  - Signature Voidtech weapon
  - Passive mutation
  - Co-op aura (e.g., buff nearby allies' damage, XP gain)

---

## 7. Weapons & Evolutions

- Up to 6 active weapons and 6 passive modules
- **Weapon Synergy Across Players:**

  - Combine attacks from different players to trigger chain reactions
  - Example: Plasma Lash + Acid Glob → "Corrosive Net Field"

- Evolutions unlock via pickups and correct item combinations

---

## 8. Modules (Passives)

- Shared pool of loot — players must coordinate picks in co-op
- Some passives gain effects when stacked by multiple players:
  - **Temporal Shield Matrix**: Boosts if two players have it equipped
  - **Neural Link Core**: Unlocks a linked dash ability

---

## 9. Advanced Systems

### 9.1 Void Protocols (Run Modifiers)

- Select 1 Protocol at start per team, unlock 2 more during run
- Synergistic co-op options:
  - **Protocol: Unholy Circuit** – Link damage between teammates
  - **Protocol: Transference** – Share stats with lowest HP teammate

### 9.2 Mutation Overload (Post-Cap Scaling)

- Each player may mutate weapons individually
- Co-op Mutation Syncs: Shared overload events when all players max gear

### 9.3 Relics

- Some relics are **team-bound** and only activate in multiplayer:
  - **Echo Codex**: Teammates can see each other's upgrades
  - **Void Tether Node**: Teleport to furthest surviving player

---

## 10. Enemies & Stage Design

### 10.1 Enemy Scaling

- Enemy HP, damage, spawn rates scale dynamically based on player count
- Co-op exclusive enemy types (e.g., split-aggro bosses, cooperative puzzle enemies)

### 10.2 Stages

- Includes terrain designed for co-op:
  - Choke points, corridors, environmental hazards
  - Example: **Cryo-Stasis Ring** — must split up and activate sync-beacons

---

## 11. Visual & Audio Design

| Feature         | Description                                                |
| --------------- | ---------------------------------------------------------- |
| **Graphics**    | Cyberorganic pixel art with space-horror elements          |
| **UI**          | Per-player HUD overlays, ping system, co-op indicators     |
| **Sound**       | Reactive SFX with co-op blending, atmospheric horror loops |
| **Performance** | Optimized for multi-client sync, 60fps target              |

---

## 12. State Management & Persistence

| State Scope      | Tool/Approach                        |
| ---------------- | ------------------------------------ |
| UI & Game State  | Zustand or Context API               |
| Multiplayer Sync | WebSockets with authoritative server |
| Save Data        | IndexedDB per player                 |
| Matchmaking      | Custom lobby or socket room          |

---

## 13. Deployment Plan

| Platform           | Hosting                                          | Deployment Strategy |
| ------------------ | ------------------------------------------------ | ------------------- |
| Web Browser        | Vercel, Netlify, Cloudflare Pages                |
| Multiplayer Server | Node.js w/ Socket.IO or tRPC (hosted separately) |
| PWA                | Offline ready with Manifest + Service Workers    |
| CDN Assets         | Audio and visual sprite optimizations            |

---

## 14. Monetization Strategy

| Revenue Stream      | Description                                                |
| ------------------- | ---------------------------------------------------------- |
| Co-op Cosmetics     | Unique skins, emotes, taunt effects only visible in co-op  |
| Ad Support (Mobile) | Opt-in revive ads, bonus XP for full team                  |
| DLC Packs           | New missions, co-op protocols, co-op relics                |
| Server Pass         | Optional subscription for premium matchmaking + cloud save |

---

## 15. Analytics & Live Services

| Service         | Function                                           |
| --------------- | -------------------------------------------------- |
| Session Metrics | Track team sizes, survivability, upgrades used     |
| Server Logs     | Monitor latency, disconnects, version mismatches   |
| Leaderboards    | Co-op run records (fastest clear, longest survive) |
| A/B Testing     | Experimental co-op relics or synergies             |

---

## 16. Risk Analysis

| Risk                      | Mitigation                                         |
| ------------------------- | -------------------------------------------------- |
| Multiplayer desync        | Deterministic core loop, server-authoritative mode |
| Peer disconnects          | Hot-join/rejoin logic with fallback AI             |
| Host migration complexity | Prefer centralized server hosting for consistency  |
| Balancing co-op synergies | Run test cycles, monitor upgrade frequency         |
| Browser net constraints   | Use WebRTC fallback or TURN servers if needed      |

---

## 17. Roadmap (Updated for Co-Op)

| Feature                      | Priority     | Release Phase |
| ---------------------------- | ------------ | ------------- |
| Online Co-op (1-4 players)   | **Critical** | Phase 1       |
| Matchmaking & Lobby Browser  | High         | Phase 1.5     |
| Team Relics & Void Protocols | High         | Phase 2       |
| Co-op Leaderboards           | Medium       | Phase 2       |
| Co-op Challenges (Daily)     | Medium       | Phase 3       |
| PvPvE Mutation Arenas        | Low          | Phase 3+      |

---

## 18. Summary

With **real-time 1-4 player co-op**, _Void Chaos_ now blends bullet-hell chaos with sci-fi horror survival and team-based tactical builds. Using lightweight and scalable web technology, it offers a fast, frictionless way to hop into a terrifying space anomaly with friends — and try to survive what lurks within. With co-op-exclusive synergy systems, bosses, and unlockables, it pushes replayability and coordination into the unknown void.
