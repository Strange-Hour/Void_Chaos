"use client";

import { useEffect, useRef, useState } from "react";
import { Game } from "@engine/Game";
import {
  WaveSpawnSystem,
  WaveConfig,
} from "@engine/ecs/systems/WaveSpawnSystem";
import { Entity } from "@engine/ecs/Entity";
import { Transform } from "@engine/ecs/components/Transform";
import { EnemyType } from "@engine/ecs/components/Enemy";
import { World } from "@engine/ecs/World";
import { RenderSystem } from "@engine/ecs/systems/RenderSystem";
import { Renderer } from "@engine/ecs/components/Renderer";
import { Sprite } from "@engine/Sprite";
import { EnemyFactory } from "@engine/ecs/factories/EnemyFactory";
import { Player } from "@engine/ecs/components/Player";
import { AIBehaviorSystem } from "@engine/ecs/systems/AIBehaviorSystem";
import { CharacterControllerSystem } from "@engine/ecs/systems/CharacterControllerSystem";
import { InputManager } from "@engine/input/InputManager";
import { CharacterController } from "@engine/ecs/components/CharacterController";
import { KeyboardInputProvider } from "@engine/input/KeyboardInputProvider";
import { InputAction } from "@engine/input/types";
import { InputSystem } from "@engine/ecs/systems/InputSystem";
import { DebugSystem } from "@engine/ecs/systems/DebugSystem";
import { WorldSystem } from "@engine/ecs/systems/WorldSystem";
import { SpriteManager } from "@engine/SpriteManager";
import { CollisionSystem } from "@engine/ecs/systems/CollisionSystem";
import { Collider } from "@engine/ecs/components/Collider";
import { Enemy } from "@engine/ecs/components/Enemy";
import { Health } from "@engine/ecs/components/Health";

// This ensures the component is a Client Component in Next.js

// At the top of the file, add this interface
interface CustomWindow extends Window {
  debugSystem?: DebugSystem;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  checkDebugStatus?: any;
  game?: Game;
  gameWorld?: World;
  collisionSystem?: CollisionSystem;
  checkCollisions?: () => void;
  _lastGameRedrawTime?: number;
}

/**
 * Utility function to check debug system status
 */
function checkDebugStatus() {
  if (typeof window !== "undefined") {
    const debugSystem = (window as CustomWindow).debugSystem;
    if (debugSystem) {
      const isEnabled = (debugSystem as unknown as { isEnabled: boolean })
        .isEnabled;
      console.log("Debug system status:", isEnabled);
      return isEnabled;
    }
  }
  return false;
}

/**
 * Utility function to check collision system status and entity colliders
 */
function checkCollisions() {
  if (typeof window !== "undefined") {
    const collisionSystem = (window as CustomWindow).collisionSystem;
    const world = (window as CustomWindow).gameWorld;

    if (!collisionSystem || !world) {
      console.error("Collision system or world not available");
      return;
    }

    console.log("Checking collision system:", {
      system: collisionSystem.constructor.name,
      entities: collisionSystem.getEntities().length,
    });

    // Get and log all entities with colliders
    const entitiesWithColliders = world
      .getEntities()
      .filter((e) => e.hasComponent("collider"));

    console.log(
      `Found ${entitiesWithColliders.length} entities with colliders:`
    );
    entitiesWithColliders.forEach((entity) => {
      const collider = entity.getComponent("collider") as Collider;
      const transform = entity.getComponent("transform") as Transform;
      const position = transform ? transform.getPosition() : { x: 0, y: 0 };

      // Determine entity type
      let entityType = "unknown";
      if (entity.hasComponent("player")) entityType = "player";
      else if (entity.hasComponent("enemy")) {
        const enemy = entity.getComponent("enemy") as Enemy;
        entityType = `enemy (${enemy.getEnemyType()})`;
      }

      console.log(`- Entity ${entity.getId()} (${entityType}):`);
      console.log(`  Position: x=${position.x}, y=${position.y}`);
      console.log(`  Collider layer: ${collider.getLayer()}`);
      console.log(`  Bounds: ${JSON.stringify(collider.getBounds())}`);
    });

    // Check if player and enemies exist and their distance
    const players = entitiesWithColliders.filter((e) =>
      e.hasComponent("player")
    );
    const enemies = entitiesWithColliders.filter((e) =>
      e.hasComponent("enemy")
    );

    if (players.length > 0 && enemies.length > 0) {
      const player = players[0];
      const playerTransform = player.getComponent("transform") as Transform;
      const playerPos = playerTransform.getPosition();

      console.log("\nDistances from player to enemies:");
      enemies.forEach((enemy) => {
        const enemyTransform = enemy.getComponent("transform") as Transform;
        const enemyPos = enemyTransform.getPosition();

        const dx = playerPos.x - enemyPos.x;
        const dy = playerPos.y - enemyPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        console.log(
          `- Enemy ${enemy.getId()}: distance=${distance.toFixed(2)} units`
        );
      });
    }
  }
}

// Don't access window at the top level
// (window as CustomWindow).checkDebugStatus = checkDebugStatus;

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [debug, setDebug] = useState(false);
  const [playerStats, setPlayerStats] = useState("HP: 100");
  const [entityCount, setEntityCount] = useState(0);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Make the debug function available in the browser console
    // This is now safely inside useEffect which only runs client-side
    if (typeof window !== "undefined") {
      (window as CustomWindow).checkDebugStatus = checkDebugStatus;
    }

    // Create container for the canvas
    const containerId = "game-canvas-container";
    containerRef.current.id = containerId;

    // Create world instance
    const world = new World();

    // Initialize game with fixed timestep
    const game = new Game({
      width: 800,
      height: 600,
      containerId,
      backgroundColor: "#1a1a1a",
      fixedTimeStep: 1000 / 60, // 60 FPS physics
      targetFPS: 60,
    });

    // Create input manager and provider
    const inputManager = new InputManager({
      enableKeyboard: true,
      enableMouse: true,
      bufferConfig: {
        enabled: true,
        duration: 100,
      },
    });
    const keyboardProvider = new KeyboardInputProvider();
    inputManager.registerProvider(keyboardProvider);

    // Add global key event listener to debug F1 presses
    const keyListener = (e: KeyboardEvent) => {
      console.log(`Key pressed: ${e.key} (keyCode: ${e.keyCode})`);

      // Add an R key handler to force a redraw of the game
      if (e.key === "r" || e.key === "R") {
        console.log("Force redraw triggered by keyboard (R key)");
        if (typeof window !== "undefined" && (window as CustomWindow).game) {
          const game = (window as CustomWindow).game;
          // Force redraw
          (game as unknown as { forceRedraw: () => void }).forceRedraw();
        }
      }
    };

    // Only add event listeners in the browser
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", keyListener);
    }

    // Set up an interval to force redraw regularly to ensure debug lines are updated
    const redrawInterval = setInterval(() => {
      if (
        typeof window !== "undefined" &&
        (window as CustomWindow).game &&
        debug // Only force redraw when debug is enabled
      ) {
        const game = (window as CustomWindow).game;
        if (game) {
          // Use a flag to prevent overlapping or excessive redraws
          const customWin = window as CustomWindow;
          const lastRedrawTime = customWin._lastGameRedrawTime || 0;
          const currentTime = Date.now();

          // Only redraw if at least 500ms have passed since the last redraw
          if (currentTime - lastRedrawTime > 500) {
            console.log("Automatic force redraw triggered (interval)");
            (game as unknown as { forceRedraw: () => void }).forceRedraw();
            customWin._lastGameRedrawTime = currentTime;

            // Update stats display
            if (customWin.gameWorld) {
              const world = customWin.gameWorld;

              // Update entity count
              setEntityCount(world.getEntities().length);

              // Update FPS (fixed value since Canvas doesn't expose FPS)
              setFps(60);

              // Update player stats if player exists
              const players = world
                .getEntities()
                .filter((e) => e.hasComponent("player"));
              if (players.length > 0) {
                const player = players[0];
                if (player.hasComponent("health")) {
                  const health = player.getComponent("health") as Health;
                  setPlayerStats(
                    `HP: ${health.getCurrentHealth()}/${health.getMaxHealth()}`
                  );
                }
              }
            }
          }
        }
      }
    }, 2000); // Check less frequently to reduce overhead

    // Create F1 key subscription to toggle debug mode
    const debugSubscriber = {
      onInputActionStart: (action: InputAction) => {
        console.log(`InputAction received: ${action}`);
        if (action === InputAction.Debug) {
          console.log("Debug action received through subscription!");

          // Add code to check the player's movement direction
          if (
            typeof window !== "undefined" &&
            (window as CustomWindow).debugSystem
          ) {
            // Force player to have a move direction for testing
            setTimeout(() => {
              const debugSystem = (window as CustomWindow).debugSystem;
              if (debugSystem) {
                // Call forceDebugDraw with proper type assertion
                (
                  debugSystem as unknown as { forceDebugDraw: () => void }
                ).forceDebugDraw();

                // Log the state of the debug entities
                const isEnabled = (
                  debugSystem as unknown as { isEnabled: boolean }
                ).isEnabled;
                console.log("Debug entities state:", {
                  isEnabled: isEnabled,
                });

                // Make sure React state matches engine state
                setDebug(isEnabled);
              }
            }, 100); // Small delay to ensure player is registered
          }

          setDebug((prev) => {
            const newDebugState = !prev;
            console.log(
              `React debug mode ${newDebugState ? "enabled" : "disabled"}`
            );

            // Synchronize the engine's debug system with React state
            if (
              typeof window !== "undefined" &&
              (window as CustomWindow).debugSystem
            ) {
              const debugSystem = (window as CustomWindow).debugSystem;
              if (debugSystem) {
                // Check current engine debug state
                const currentState = (
                  debugSystem as unknown as { isEnabled: boolean }
                ).isEnabled;

                // Only toggle if states are out of sync
                if (currentState !== newDebugState) {
                  console.log(
                    "Synchronizing DebugSystem state with React state"
                  );
                  debugSystem.toggleDebug();
                }
              }
            }

            return newDebugState;
          });
        }
      },
    };

    // Subscribe to input events
    inputManager.subscribe(debugSubscriber);

    // Log the current debug state for verification
    console.log("Initial debug state:", debug);

    // Preload essential sprites before creating game entities
    SpriteManager.preloadEssentialSprites()
      .then(() => {
        // Create sprites with preloaded assets
        const playerSprite = new Sprite({
          url: "/sprites/player",
          width: 32,
          height: 32,
        });

        // Set enemy sprites
        const basicEnemySprite = new Sprite({
          url: "/sprites/enemy-basic",
          width: 32,
          height: 32,
        });

        const flankerEnemySprite = new Sprite({
          url: "/sprites/enemy-flanker",
          width: 32,
          height: 32,
        });

        const rangedEnemySprite = new Sprite({
          url: "/sprites/enemy-ranged",
          width: 32,
          height: 32,
        });

        // Debug log for sprite states
        console.log("Sprite states after creation:", {
          player: {
            url: playerSprite.getUrl(),
            loaded: playerSprite.isReady(),
            imageComplete: playerSprite.getImage().complete,
          },
          basic: {
            url: basicEnemySprite.getUrl(),
            loaded: basicEnemySprite.isReady(),
            imageComplete: basicEnemySprite.getImage().complete,
          },
          flanker: {
            url: flankerEnemySprite.getUrl(),
            loaded: flankerEnemySprite.isReady(),
            imageComplete: flankerEnemySprite.getImage().complete,
          },
          ranged: {
            url: rangedEnemySprite.getUrl(),
            loaded: rangedEnemySprite.isReady(),
            imageComplete: rangedEnemySprite.getImage().complete,
          },
        });

        // Force load all sprites manually with increased timeout
        Promise.all([
          playerSprite
            .forceLoad(10000)
            .then(() => console.log("Player sprite loaded successfully"))
            .catch((err) => console.error("Player sprite load failed:", err)),
          basicEnemySprite
            .forceLoad(10000)
            .then(() => console.log("Basic enemy sprite loaded successfully"))
            .catch((err) =>
              console.error("Basic enemy sprite load failed:", err)
            ),
          flankerEnemySprite
            .forceLoad(10000)
            .then(() => console.log("Flanker enemy sprite loaded successfully"))
            .catch((err) =>
              console.error("Flanker enemy sprite load failed:", err)
            ),
          rangedEnemySprite
            .forceLoad(10000)
            .then(() => console.log("Ranged enemy sprite loaded successfully"))
            .catch((err) =>
              console.error("Ranged enemy sprite load failed:", err)
            ),
        ])
          .then(() => {
            console.log("All sprites force-loaded successfully");

            // Debug log for sprite states after loading
            console.log("Sprite states after loading:", {
              player: {
                url: playerSprite.getUrl(),
                loaded: playerSprite.isReady(),
                imageComplete: playerSprite.getImage().complete,
              },
              basic: {
                url: basicEnemySprite.getUrl(),
                loaded: basicEnemySprite.isReady(),
                imageComplete: basicEnemySprite.getImage().complete,
              },
              flanker: {
                url: flankerEnemySprite.getUrl(),
                loaded: flankerEnemySprite.isReady(),
                imageComplete: flankerEnemySprite.getImage().complete,
              },
              ranged: {
                url: rangedEnemySprite.getUrl(),
                loaded: rangedEnemySprite.isReady(),
                imageComplete: rangedEnemySprite.getImage().complete,
              },
            });

            EnemyFactory.setEnemySprite(EnemyType.Basic, basicEnemySprite);
            EnemyFactory.setEnemySprite(EnemyType.Flanker, flankerEnemySprite);
            EnemyFactory.setEnemySprite(EnemyType.Ranged, rangedEnemySprite);

            // Check if enemy sprites are loaded
            SpriteManager.checkEnemySpritesLoaded();

            // Initialize systems
            const inputSystem = new InputSystem(inputManager);
            const renderSystem = new RenderSystem(game.getCanvas());
            const characterSystem = new CharacterControllerSystem(inputManager);
            const debugSystem = new DebugSystem(game.getCanvas(), inputManager);
            const aiBehaviorSystem = new AIBehaviorSystem();
            const waveSpawnSystem = new WaveSpawnSystem(world);

            // Initialize collision system
            console.log("Initializing collision system for the game...");
            const collisionSystem = game.initializeCollisionSystem();

            // Enable debug mode for collision system
            collisionSystem.setDebug(true);
            collisionSystem.setResolutionStrength(0.7); // Stronger collision response

            // Configure collision layers
            // Layer 1 = Player, Layer 2 = Enemies
            collisionSystem.setLayerCollision(1, 1, true); // Player can collide with player (not relevant in single player)
            collisionSystem.setLayerCollision(1, 2, true); // Player can collide with enemies
            collisionSystem.setLayerCollision(2, 2, false); // Enemies cannot collide with other enemies

            console.log("Collision system created and configured:", {
              system: collisionSystem.constructor.name,
              requirements: collisionSystem.getRequiredComponents(),
              debug: true,
              resolutionStrength: 0.7,
            });

            // Store reference to debug system for debugging
            (window as CustomWindow).debugSystem = debugSystem;
            (window as CustomWindow).collisionSystem = collisionSystem;
            (window as CustomWindow).gameWorld = world;
            (window as CustomWindow).checkCollisions = checkCollisions;

            // Log debug system state
            console.log("DebugSystem initialized:", {
              system: debugSystem.constructor.name,
              requirements: debugSystem.getRequiredComponents(),
              isEnabled: (debugSystem as unknown as { isEnabled: boolean })
                .isEnabled,
            });

            // Make sure React state matches initial DebugSystem state
            const debugSystemEnabled = (
              debugSystem as unknown as { isEnabled: boolean }
            ).isEnabled;
            if (debug !== debugSystemEnabled) {
              console.log(
                "Synchronizing initial React state with DebugSystem",
                {
                  reactState: debug,
                  debugSystemState: debugSystemEnabled,
                }
              );
              setDebug(debugSystemEnabled);
            }

            // Create wave spawn system with boundary config
            const boundary = {
              width: 800,
              height: 600,
              padding: 50,
            };

            const waveConfig: WaveConfig[] = [
              {
                enemies: [
                  { type: EnemyType.Basic, count: 5 },
                  { type: EnemyType.Flanker, count: 2 },
                ],
                spawnDelay: 2000,
                waveDelay: 5000,
              },
              {
                enemies: [
                  { type: EnemyType.Basic, count: 8 },
                  { type: EnemyType.Flanker, count: 3 },
                  { type: EnemyType.Ranged, count: 2 },
                ],
                spawnDelay: 1500,
                waveDelay: 5000,
              },
            ];

            waveSpawnSystem.configure(waveConfig, boundary, {
              baseHealth: 1,
              baseDamage: 1,
              baseSpeed: 1,
              waveScaling: 0.1,
              playerScaling: 0.3,
            });
            waveSpawnSystem.setSpawnPattern("sequential");
            waveSpawnSystem.setDebug(true); // Enable debug logging for spawn system

            // Add systems to world in correct order
            world.addSystem(inputSystem);
            world.addSystem(characterSystem);
            world.addSystem(waveSpawnSystem);
            world.addSystem(aiBehaviorSystem);
            world.addSystem(debugSystem);
            world.addSystem(renderSystem);

            // Add collision system to the world as well to ensure it receives entities
            world.addSystem(collisionSystem);
            console.log(
              "Added collision system to world, now has these systems:",
              world.getSystems().map((s) => s.constructor.name)
            );

            // Create WorldSystem to manage world updates
            const worldSystem = new WorldSystem(world);

            // Add only the WorldSystem to the game
            game.addSystem(worldSystem);

            // Create and add player after systems are initialized
            const player = createPlayer(playerSprite);
            world.addEntity(player);

            // Check if player has the required components for DebugSystem
            const debugRequirements = debugSystem.getRequiredComponents();
            const playerHasRequiredComponents = debugRequirements.every(
              (component) => player.hasComponent(component)
            );

            console.log("Player component check for DebugSystem:", {
              playerComponents: player.getComponents().map((c) => c.getType()),
              debugRequirements,
              playerHasRequiredComponents,
            });

            // Process a full update cycle to ensure entity is registered
            world.processEntityChanges();
            world.update(0);
            world.fixedUpdate(1 / 60); // Process one physics frame

            // Debug log initial state
            console.log("Initial world state:", {
              entityCount: world.getEntities().length,
              playerComponents: player.getComponents().map((c) => ({
                type: c.getType(),
                name: c.constructor.name,
              })),
              systems: world.getSystems().map((s) => ({
                name: s.constructor.name,
                entities: s.getEntities().length,
                requirements: s.getRequiredComponents(),
              })),
            });

            // Start the wave system
            waveSpawnSystem.startNextWave();

            // Check sprite loading status again before starting the game
            SpriteManager.checkEnemySpritesLoaded();

            // Start the game
            game.start();

            // Store reference for debugging
            if (typeof window !== "undefined") {
              (window as CustomWindow).game = game;
              console.log(
                "Game reference stored in window object for debugging"
              );

              // Also store the world reference for direct access
              (window as CustomWindow).gameWorld = world;
              console.log(
                "World reference stored in window object for debugging"
              );
            }

            // Add debug logging for wave spawn system
            setInterval(() => {
              const remainingEnemies = waveSpawnSystem.getRemainingEnemies();
              const currentWave = waveSpawnSystem.getCurrentWave();
              const entities = world.getEntities();
              const enemyCount = entities.filter((e) =>
                e.hasComponent("enemy")
              ).length;
              const systems = world.getSystems();

              console.log("Wave Status:", {
                currentWave,
                remainingEnemies,
                totalEntities: entities.length,
                enemyCount,
                renderEntities: renderSystem.getEntities().length,
                systems: systems.map((s) => ({
                  name: s.constructor.name,
                  entities: s.getEntities().length,
                })),
              });
            }, 2000);
          })
          .catch((error) => {
            console.error("Failed to force-load sprites:", error);
          });
      })
      .catch((error) => {
        console.error("Failed to preload essential sprites:", error);
      });

    // Cleanup on unmount
    return () => {
      game.stop();
      inputManager.dispose();
      world.clear();
      clearInterval(redrawInterval);
      if (typeof window !== "undefined") {
        window.removeEventListener("keydown", keyListener);
      }
    };
  }, []);

  return (
    <div className='relative w-full h-full'>
      <div
        ref={containerRef}
        className='w-full h-full flex items-center justify-center'
      ></div>

      {/* Debug status display */}
      {debug && (
        <div className='absolute bottom-[-150px] right-0 bg-black bg-opacity-80 text-white p-2 text-sm'>
          <p>Debug: ENABLED (F1 to toggle)</p>
          <p>Player Stats: {playerStats}</p>
          <p>
            Entities: {entityCount} / FPS: {fps}
          </p>
          <p className='text-yellow-400 text-xs mt-2'>
            Open browser console and run{" "}
            <span className='font-mono'>window.checkCollisions()</span> to debug
            collision issues
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function to create player entity
function createPlayer(sprite: Sprite): Entity {
  const player = new Entity();

  // Get sprite dimensions to correctly position the player
  const dimensions = sprite.getDimensions();

  // Add transform component - position is at the center of the screen
  const transform = new Transform();
  transform.setPosition({ x: 400, y: 300 }); // Center of 800x600 canvas
  player.addComponent(transform);

  // Add renderer component
  const renderer = new Renderer(sprite);
  renderer.setZIndex(10); // Ensure player is drawn above other entities
  player.addComponent(renderer);

  // Add character controller with improved parameters for better movement
  const controller = new CharacterController({
    maxSpeed: 300,
    acceleration: 2000,
    deceleration: 1500,
  });
  player.addComponent(controller);

  // Add player component to identify as player
  player.addComponent(new Player());

  // Add collider component for collision detection
  const collider = new Collider(
    {
      width: 32,
      height: 32,
      offset: { x: -16, y: -16 }, // Center collider on player
    },
    {
      layer: 1, // Player is on layer 1
      isTrigger: false,
      isStatic: false,
    }
  );
  player.addComponent(collider);

  // Add health component
  const health = new Health({ maxHealth: 100 });
  player.addComponent(health);

  // Set an initial aim direction to test debug visualization
  const playerController = player.getComponent(
    "character-controller"
  ) as CharacterController;
  if (playerController) {
    // Only set aim direction initially; remove default movement to prevent drifting
    playerController.setAimDirection({ x: 1, y: 0 });
  }

  // Debug log component types
  console.log("Player entity created:", {
    position: transform.getPosition(),
    dimensions,
    sprite: {
      url: sprite.getUrl(),
      loaded: sprite.isReady(),
    },
    collider: {
      layer: collider.getLayer(),
      bounds: collider.getBounds(),
    },
    health: {
      current: health.getCurrentHealth(),
      max: health.getMaxHealth(),
    },
    components: player.getComponents().map((c) => ({
      type: c.getType(),
      name: c.constructor.name,
    })),
  });

  return player;
}
